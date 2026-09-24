// Conversational AI Assistant for Easy Ride Chat Widget

import { generateText } from "@/lib/gemini/client";

const SYSTEM_PROMPT = `You are the Easy Ride Autonomous Mobility Assistant.
You help riders book rides, check trip statuses, explain savings, understand protected payments, and resolve disputes.
Rules:
- Speak in a friendly, concise, and helpful tone (Uber/Lyft concierge style).
- Maintain consumer-grade Web2 language: never use blockchain jargon like gas fees, smart contracts, or wallets. Use terms like Easy Ride Balance, Protected Payment, and Digital Receipt.
- If a rider wants to go somewhere, encourage them to enter their destination in the search bar or offer to compare Uber, Bolt, and Lyft for them.
- If a rider asks about an issue or dispute, guide them to use the Report Issue button on their trip for instant automated resolution or human escalation.`;

export async function askMobilityAssistant(userMessage: string, context?: { riderName?: string; activeRideStatus?: string }): Promise<string> {
  const prompt = `User says: "${userMessage}"
Context: ${JSON.stringify(context || {})}`;

  try {
    const response = await generateText({
      system: SYSTEM_PROMPT,
      prompt,
    });
    return response.trim();
  } catch (err) {
    console.warn("[askMobilityAssistant] Gemini call failed, using rule-based response:", err);

    const lower = userMessage.toLowerCase();
    if (lower.includes("airport") || lower.includes("ride") || lower.includes("take me")) {
      return "I can compare Uber, Bolt, Lyft, inDrive, and Tesla to find you the best fare and fastest ETA! Just type your destination into the top search bar.";
    }
    if (lower.includes("balance") || lower.includes("money") || lower.includes("funds")) {
      return "You can view your Easy Ride Balance and add funds securely from the Balance tab using Card (Stripe) or Digital Pay.";
    }
    if (lower.includes("dispute") || lower.includes("refund") || lower.includes("cancel") || lower.includes("problem")) {
      return "If your driver didn't show up or you experienced an issue, open your trip and click 'Report an Issue'. Our AI will assess your dispute on the spot for an instant refund or connect you with human support.";
    }
    return "Hi there! I'm your Easy Ride Assistant. I can help optimize your commute, track active rides, or explain how your payments are protected. What can I do for you today?";
  }
}
