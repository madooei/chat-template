import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const DEFAULT_MODEL = "openai/gpt-4o";
const DEFAULT_MINI_MODEL = "openai/gpt-4o-mini";

export function getModel(modelId?: string) {
  return openrouter.chat(modelId || process.env.MODEL || DEFAULT_MODEL);
}

export function getMiniModel(modelId?: string) {
  return openrouter.chat(
    modelId || process.env.MODEL_MINI || DEFAULT_MINI_MODEL,
  );
}
