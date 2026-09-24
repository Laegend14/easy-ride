import "server-only";
import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/lib/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
  }
  return client;
}

/** Pull the first balanced JSON object/array out of a model response. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  if (start === -1) return body;
  const open = body[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < body.length; i++) {
    if (body[i] === open) depth++;
    else if (body[i] === close) {
      depth--;
      if (depth === 0) return body.slice(start, i + 1);
    }
  }
  return body.slice(start);
}

/**
 * Ask Gemini for JSON and parse it. Version-tolerant: requests JSON via
 * responseMimeType and relies on an explicit shape in the prompt; tolerantly
 * extracts the JSON from the response. Throws on failure so callers can fall back.
 */
export async function generateJson<T>(args: {
  prompt: string;
  system?: string;
}): Promise<T> {
  const ai = getGeminiClient();
  const res = await ai.models.generateContent({
    model: serverEnv.geminiModel,
    contents: args.prompt,
    config: {
      responseMimeType: "application/json",
      ...(args.system ? { systemInstruction: args.system } : {}),
    },
  });

  const text = res.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return JSON.parse(extractJson(text)) as T;
}

export async function generateText(args: {
  prompt: string;
  system?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const res = await ai.models.generateContent({
    model: serverEnv.geminiModel,
    contents: args.prompt,
    config: {
      ...(args.system ? { systemInstruction: args.system } : {}),
    },
  });

  const text = res.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

