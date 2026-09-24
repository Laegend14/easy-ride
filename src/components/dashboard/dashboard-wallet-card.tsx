"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  Loader2,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { createStripeCheckoutAction, withdrawAction, type FundingState } from "@/app/(app)/balance/actions";
import { cn } from "@/lib/utils";

interface DashboardWalletCardProps {
  initialBalance: number; // in dollars
  cryptoUsdc?: number;
  stripeUsd?: number;
  address?: string;
  isActive?: boolean;
}

const INITIAL_STATE: FundingState = { error: null };

export function DashboardWalletCard({
  initialBalance,
  cryptoUsdc,
  stripeUsd,
  address,
  isActive = true,
}: DashboardWalletCardProps) {
  const [mode, setMode] = useState<"topup" | "withdraw">("topup");
  const [topUpMethod, setTopUpMethod] = useState<"stripe" | "web3">("stripe");
  const [selectedPreset, setSelectedPreset] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("50");

  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [wdState, wdAction, isWithdrawing] = useActionState(withdrawAction, INITIAL_STATE);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(initialBalance);

  const handlePresetSelect = (amt: number) => {
    setSelectedPreset(amt);
    setCustomAmount(String(amt));
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && [20, 50, 100, 200].includes(parsed)) {
      setSelectedPreset(parsed);
    } else {
      setSelectedPreset(0);
    }
  };

  const currentAmountNum = parseFloat(customAmount) || selectedPreset || 50;

  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirectingToStripe(true);
    setStripeError(null);

    try {
      const res = await createStripeCheckoutAction(currentAmountNum, window.location.origin);
      if (res.error || !res.url) {
        setStripeError(res.error || "Failed to initialize Stripe checkout.");
        setIsRedirectingToStripe(false);
      } else {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setStripeError(err.message || "Failed to connect to Stripe.");
      setIsRedirectingToStripe(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-xl shadow-2xl transition-all">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo/15 blur-3xl" />

      {/* Card Header & Balance Hero */}
      <div className="p-5 sm:p-6 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand p-[1px] shadow-lg shadow-indigo/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[15px] bg-[#12121f] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-teal" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
                Easy Ride Wallet
              </h3>
              <p className="text-[11px] text-muted">Smart Escrow Protected</p>
            </div>
          </div>

          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 border border-teal/25 px-2.5 py-1 text-[11px] font-semibold text-teal shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              Live On-Chain
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-muted">
              <Loader2 className="w-3 h-3 animate-spin" /> Initializing
            </span>
          )}
        </div>

        {/* Balance Display */}
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {formattedBalance}
            </span>
            <span className="text-xs font-bold text-teal uppercase tracking-wider bg-teal/10 px-2 py-0.5 rounded-md">
              USDC
            </span>
          </div>

          {/* Real balance breakdown */}
          <div className="flex items-center gap-3 text-[11px] text-muted mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              On-chain Crypto:{" "}
              <strong className="text-foreground">${(cryptoUsdc ?? initialBalance).toFixed(2)}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo" />
              Stripe USD:{" "}
              <strong className="text-foreground">${(stripeUsd ?? 0).toFixed(2)}</strong>
            </span>
          </div>

          <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal shrink-0" />
            Real on-chain & verified payments · Zero simulated balance
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-black/30 p-1 rounded-2xl mt-5 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("topup")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
              mode === "topup"
                ? "bg-gradient-brand text-white shadow-md shadow-indigo/20"
                : "text-muted hover:text-foreground hover:bg-white/5"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Funds
          </button>
          <button
            type="button"
            onClick={() => setMode("withdraw")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
              mode === "withdraw"
                ? "bg-gradient-brand text-white shadow-md shadow-indigo/20"
                : "text-muted hover:text-foreground hover:bg-white/5"
            )}
          >
            <Minus className="w-3.5 h-3.5" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Card Body — Top Up Mode */}
      {mode === "topup" && (
        <div className="p-5 sm:p-6 space-y-4 relative z-10">
          {/* Top-up Method Switcher: Stripe (USD) vs Web3 Address */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/5">
            <button
              type="button"
              onClick={() => setTopUpMethod("stripe")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
                topUpMethod === "stripe"
                  ? "bg-white/15 text-white border border-white/10 shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo" />
              Pay with Stripe (USD)
            </button>
            <button
              type="button"
              onClick={() => setTopUpMethod("web3")}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
                topUpMethod === "web3"
                  ? "bg-white/15 text-white border border-white/10 shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <QrCode className="w-3.5 h-3.5 text-teal" />
              Web3 Address
            </button>
          </div>

          {/* METHOD 1: USD via Stripe Checkout */}
          {topUpMethod === "stripe" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 block">
                  Select USD Deposit Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetSelect(amt)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-0.5",
                        selectedPreset === amt
                          ? "border-teal/50 bg-teal/15 text-teal shadow-xs shadow-teal/10"
                          : "border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      <span>+${amt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount field */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                  Custom Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="2000"
                    step="1"
                    value={customAmount}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    placeholder="50"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-foreground focus:outline-none focus:border-teal/50 transition font-mono"
                  />
                </div>
              </div>

              {/* Supported payment rails indicator */}
              <div className="flex items-center justify-between text-[11px] text-muted px-1">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo" />
                  Cards · Apple Pay · Google Pay
                </span>
                <span className="text-[10px] text-teal font-semibold bg-teal/10 px-2 py-0.5 rounded-full">
                  Stripe Checkout
                </span>
              </div>

              {stripeError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{stripeError}</span>
                </div>
              )}

              {/* Real Stripe Checkout Button */}
              <form onSubmit={handleStripeCheckout}>
                <button
                  type="submit"
                  disabled={isRedirectingToStripe}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-brand text-white font-bold text-sm shadow-xl shadow-indigo/25 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isRedirectingToStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Stripe Checkout…</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Continue to Stripe Checkout (${currentAmountNum.toFixed(2)})</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* METHOD 2: Web3 Deposit Address */}
          {topUpMethod === "web3" && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Your Personal Web3 Deposit Address
                    </span>
                    <span className="text-[10px] text-teal font-semibold bg-teal/10 px-2 py-0.5 rounded-full">
                      Circle CCTP (Domain 26)
                    </span>
                  </div>

                  {address ? (
                    <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                      <span className="font-mono text-xs text-foreground select-all break-all">
                        {address}
                      </span>
                      <CopyButton text={address} className="shrink-0 p-1.5 hover:text-white" />
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-muted flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating your smart wallet address…</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Supported Networks
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-teal/15 border border-teal/30 text-[10px] font-bold text-teal">
                      Arc Testnet (1s finality)
                    </span>
                    {["Base", "Arbitrum", "Ethereum Sepolia"].map((chain) => (
                      <span
                        key={chain}
                        className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-medium text-foreground/80"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-muted space-y-1 leading-relaxed">
                  <p className="text-foreground/90 font-medium">How on-chain deposit works:</p>
                  <p>
                    Send USDC directly to your address on Arc Testnet, or bridge from Base/Arbitrum via
                    Circle CCTP. Tokens mint directly into your on-chain balance with 1-second finality.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Body — Withdraw Mode */}
      {mode === "withdraw" && (
        <form action={wdAction} className="p-5 sm:p-6 space-y-3.5 relative z-10">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                $
              </span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-foreground focus:outline-none focus:border-teal/50 transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
              Recipient Address
            </label>
            <input
              name="destination"
              type="text"
              defaultValue={address}
              placeholder="0x..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-foreground font-mono focus:outline-none focus:border-teal/50 transition truncate"
            />
          </div>

          {wdState.message && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{wdState.message}</span>
            </div>
          )}
          {wdState.error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{wdState.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isWithdrawing}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-foreground font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing withdrawal…</span>
              </>
            ) : (
              <span>Withdraw to External Wallet</span>
            )}
          </button>
        </form>
      )}

      {/* Card Footer */}
      <div className="p-3.5 sm:px-6 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className="text-muted text-[11px]">Instant settlement protocol</span>
        <Link
          href="/balance"
          className="text-teal hover:text-teal/80 font-semibold text-[11px] inline-flex items-center gap-1 group"
        >
          Full Ledger & Analytics
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
}
