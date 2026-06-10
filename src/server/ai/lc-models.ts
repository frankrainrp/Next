import { ChatOpenAI } from "@langchain/openai";

export type ModelChannel = "deepseek" | "openai";

/**
 * LangChain chat-model factory.
 *
 * - "deepseek" (default): DeepSeek via its OpenAI-compatible endpoint.
 * - "openai": the reserved GPT-5.5 channel.
 *
 * Routing env vars stay aligned with model-router.ts / .env.example.
 */
export function createAgentModel(channel: ModelChannel = "deepseek", customApiKey?: string) {
  if (channel === "openai") {
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
    return new ChatOpenAI({
      apiKey,
      model: process.env.OPENAI_STRONG_MODEL ?? "gpt-5.5",
      temperature: 0.3,
    });
  }

  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY_NOT_CONFIGURED");
  return new ChatOpenAI({
    apiKey,
    model: process.env.DEEPSEEK_STRONG_MODEL ?? "deepseek-v4-pro",
    temperature: 0.3,
    configuration: {
      baseURL: (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "") + "/v1",
    },
  });
}

export function hasAgentModel(channel: ModelChannel = "deepseek", customApiKey?: string) {
  return channel === "openai"
    ? Boolean(customApiKey || process.env.OPENAI_API_KEY)
    : Boolean(customApiKey || process.env.DEEPSEEK_API_KEY);
}
