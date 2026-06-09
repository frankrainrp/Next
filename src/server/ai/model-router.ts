type ModelStrength = "fast" | "strong" | "fallback" | "strongFallback";

type ModelSelection = {
  provider: "deepseek" | "openai";
  model: string;
  configured: boolean;
};

export function hasConfiguredModel() {
  return Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
}

export function hasConfiguredDeepSeek() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export function selectModel(strength: ModelStrength = "fast"): ModelSelection {
  if (strength === "fallback") {
    return {
      provider: "openai",
      model: process.env.OPENAI_FALLBACK_MODEL ?? "gpt-5.4-mini",
      configured: Boolean(process.env.OPENAI_API_KEY),
    };
  }

  if (strength === "strongFallback") {
    return {
      provider: "openai",
      model: process.env.OPENAI_STRONG_MODEL ?? "gpt-5.5",
      configured: Boolean(process.env.OPENAI_API_KEY),
    };
  }

  if (process.env.AI_PRIMARY_PROVIDER === "openai") {
    return {
      provider: "openai",
      model:
        strength === "strong"
          ? process.env.OPENAI_STRONG_MODEL ?? "gpt-5.5"
          : process.env.OPENAI_FALLBACK_MODEL ?? "gpt-5.4-mini",
      configured: Boolean(process.env.OPENAI_API_KEY),
    };
  }

  return {
    provider: "deepseek",
    model:
      strength === "strong"
        ? process.env.DEEPSEEK_STRONG_MODEL ?? "deepseek-v4-pro"
        : process.env.DEEPSEEK_FAST_MODEL ?? "deepseek-v4-flash",
    configured: Boolean(process.env.DEEPSEEK_API_KEY),
  };
}
