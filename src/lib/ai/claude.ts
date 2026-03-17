import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export interface GenerateRequest {
  type: "caption" | "hashtags" | "script";
  context: {
    title?: string;
    platform?: string;
    topic?: string;
    category?: string;
    brandVoice?: string;
    brandGuidelines?: string;
    sampleCaptions?: string[];
    ctaPhrases?: string[];
    existingCaption?: string;
  };
}

export interface GenerateResponse {
  result: string;
  type: GenerateRequest["type"];
}
