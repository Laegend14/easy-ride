import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load secrets from the app's root .env (gitignored), shared with the Next app.
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const ARC_RPC_URL = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const ARC_DEPLOYER_PRIVATE_KEY = process.env.ARC_DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // In-process network for tests + deploy:local proof.
    hardhat: {},
    // Circle Arc Testnet — native gas token is USDC. chainId 5042002.
    arc: {
      url: ARC_RPC_URL,
      chainId: 5042002,
      accounts: ARC_DEPLOYER_PRIVATE_KEY ? [ARC_DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
