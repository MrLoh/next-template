import { createAnthropic, type AnthropicProviderOptions } from '@ai-sdk/anthropic'
import { createOpenAI, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import { type LanguageModelV3 } from '@ai-sdk/provider'
import { match } from 'ts-pattern'

import config from '@/config'

export type LLM = LanguageModelV3

export const createLanguageModel = (): LLM | null => {
  const llmModel = config.LLM_MODEL
  if (!llmModel) return null
  const { providerName, modelId, apiKey } = llmModel
  return match(providerName)
    .with('openai', () => createOpenAI({ apiKey })(modelId))
    .with('anthropic', () => createAnthropic({ apiKey })(modelId))
    .exhaustive()
}

export const getModelName = (llm: LLM) => `${llm.provider.split('.')[0]}:${llm.modelId}`

export const getProviderOptions = ({
  reasoning = 'medium',
}: { reasoning?: 'low' | 'medium' | 'high' } = {}) => {
  // reasoning budgets are adopted from https://docs.requesty.ai/features/reasoning
  return {
    anthropic: {
      thinking: {
        type: 'enabled',
        budgetTokens: { low: 1024, medium: 8192, high: 16384 }[reasoning],
      },
    } satisfies AnthropicProviderOptions,
    openai: {
      reasoningSummary: 'auto',
      reasoningEffort: reasoning,
    } satisfies OpenAIResponsesProviderOptions,
  }
}
