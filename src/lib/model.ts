import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function resolveModel(): LanguageModel {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-sonnet-4-20250514");
  }

  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o");
  }

  throw new Error(
    "No API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local",
  );
}

export function resolveCategorizationModel(): LanguageModel {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required for article categorization (gpt-4.1-mini)",
    );
  }

  return openai("gpt-4.1-mini");
}

export function resolveEmbeddingModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required for embeddings (text-embedding-3-small)",
    );
  }

  return openai.embedding("text-embedding-3-small");
}
