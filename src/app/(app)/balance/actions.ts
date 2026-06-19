"use server";

import { revalidatePath } from "next/cache";
import { addFunds, withdrawFunds } from "@/lib/circle/funding";

export interface FundingState {
  error: string | null;
  message?: string;
}

export async function addFundsAction(
  _prev: FundingState,
  _formData: FormData,
): Promise<FundingState> {
  const outcome = await addFunds();
  if ("error" in outcome) return { error: outcome.error };
  revalidatePath("/balance");
  revalidatePath("/dashboard");
  return { error: null, message: outcome.result.message };
}

export async function withdrawAction(
  _prev: FundingState,
  formData: FormData,
): Promise<FundingState> {
  const amount = parseFloat(
    String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "") || "0",
  );
  const destination = String(formData.get("destination") ?? "").trim();
  const outcome = await withdrawFunds(amount, destination);
  if ("error" in outcome) return { error: outcome.error };
  revalidatePath("/balance");
  revalidatePath("/dashboard");
  return { error: null, message: outcome.result.message };
}
