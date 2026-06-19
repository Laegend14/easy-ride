// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title EasyRideEscrow
/// @notice Holds a rider's payment in escrow for a single ride and releases it to
///         the provider on completion, refunds on cancellation, or moves it to a
///         replacement provider on reassignment. Funds are native value (on Arc
///         Testnet the native gas token is USDC). The Easy Ride backend is the
///         `owner`/operator that drives the lifecycle; riders fund their own ride.
contract EasyRideEscrow {
    enum Status {
        None,
        Created,
        Funded,
        Released,
        Refunded,
        Cancelled,
        Reassigned,
        Completed
    }

    struct RideEscrow {
        bytes32 rideId;
        address rider;
        address provider;
        uint256 amount;
        Status status;
    }

    address public owner;
    mapping(bytes32 => RideEscrow) private escrows;

    // Minimal reentrancy guard (no external deps).
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancy = _NOT_ENTERED;

    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event RideEscrowCreated(bytes32 indexed rideId, address indexed rider, address indexed provider, uint256 amount);
    event RideEscrowFunded(bytes32 indexed rideId, uint256 amount);
    event RidePaymentReleased(bytes32 indexed rideId, address indexed provider, uint256 amount);
    event RidePaymentRefunded(bytes32 indexed rideId, address indexed rider, uint256 amount);
    event RideCancelled(bytes32 indexed rideId, bool refunded);
    event RideReassigned(bytes32 indexed rideId, address indexed previousProvider, address indexed newProvider);
    event RideCompleted(bytes32 indexed rideId);

    error NotOwner();
    error ZeroAddress();
    error InvalidAmount();
    error WrongValue(uint256 expected, uint256 sent);
    error InvalidStatus(Status current);
    error AlreadyExists();
    error Reentrancy();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_reentrancy == _ENTERED) revert Reentrancy();
        _reentrancy = _ENTERED;
        _;
        _reentrancy = _NOT_ENTERED;
    }

    constructor() {
        owner = msg.sender;
        emit OwnerTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Open an escrow for a ride. Operator-only.
    function createRideEscrow(bytes32 rideId, address rider, address provider, uint256 amount)
        external
        onlyOwner
    {
        if (rider == address(0) || provider == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (escrows[rideId].status != Status.None) revert AlreadyExists();

        escrows[rideId] = RideEscrow({
            rideId: rideId,
            rider: rider,
            provider: provider,
            amount: amount,
            status: Status.Created
        });
        emit RideEscrowCreated(rideId, rider, provider, amount);
    }

    /// @notice Fund a created escrow with exactly `amount` of native value.
    ///         Callable by the rider or the operator (e.g. funding from the
    ///         platform's Easy Ride Balance).
    function fundRideEscrow(bytes32 rideId) external payable nonReentrant {
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Created) revert InvalidStatus(e.status);
        if (msg.sender != e.rider && msg.sender != owner) revert NotOwner();
        if (msg.value != e.amount) revert WrongValue(e.amount, msg.value);

        e.status = Status.Funded;
        emit RideEscrowFunded(rideId, msg.value);
    }

    /// @notice Release escrowed funds to the provider. Operator-only.
    function releaseRidePayment(bytes32 rideId) external onlyOwner nonReentrant {
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Funded && e.status != Status.Completed) revert InvalidStatus(e.status);

        uint256 amount = e.amount;
        address provider = e.provider;
        e.status = Status.Released;
        _pay(provider, amount);
        emit RidePaymentReleased(rideId, provider, amount);
    }

    /// @notice Refund escrowed funds to the rider. Operator-only.
    function refundRidePayment(bytes32 rideId) external onlyOwner nonReentrant {
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Funded) revert InvalidStatus(e.status);

        uint256 amount = e.amount;
        address rider = e.rider;
        e.status = Status.Refunded;
        _pay(rider, amount);
        emit RidePaymentRefunded(rideId, rider, amount);
    }

    /// @notice Cancel a ride. Auto-refunds the rider if already funded. Operator-only.
    function cancelRide(bytes32 rideId) external onlyOwner nonReentrant {
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Created && e.status != Status.Funded) revert InvalidStatus(e.status);

        bool refunded = false;
        if (e.status == Status.Funded) {
            uint256 amount = e.amount;
            address rider = e.rider;
            e.status = Status.Cancelled;
            _pay(rider, amount);
            refunded = true;
            emit RidePaymentRefunded(rideId, rider, amount);
        } else {
            e.status = Status.Cancelled;
        }
        emit RideCancelled(rideId, refunded);
    }

    /// @notice Move a funded escrow to a replacement provider, keeping funds
    ///         locked (mirrors the agent's autonomous cancellation recovery).
    function reassignRide(bytes32 rideId, address newProvider) external onlyOwner {
        if (newProvider == address(0)) revert ZeroAddress();
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Funded) revert InvalidStatus(e.status);

        address previous = e.provider;
        e.provider = newProvider;
        // Funds stay locked; status returns to Funded after the reassignment event.
        e.status = Status.Reassigned;
        emit RideReassigned(rideId, previous, newProvider);
        e.status = Status.Funded;
    }

    /// @notice Mark a funded ride complete (ready for settlement/release). Operator-only.
    function completeRide(bytes32 rideId) external onlyOwner {
        RideEscrow storage e = escrows[rideId];
        if (e.status != Status.Funded) revert InvalidStatus(e.status);
        e.status = Status.Completed;
        emit RideCompleted(rideId);
    }

    function getRideEscrow(bytes32 rideId) external view returns (RideEscrow memory) {
        return escrows[rideId];
    }

    function _pay(address to, uint256 amount) private {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
