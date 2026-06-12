import { generateText } from 'ai'

import { getProviderOptions } from '@/infra/llm'
import { forbidden, invalidInput } from '@/utils/errors'
import { ok } from '@/utils/result'

import type { Ctx } from '../context'

export const agentService = {
  answerQuestion: async ({ llm }: Ctx, { question }: { question: string }) => {
    const trimmed = question.trim()
    if (!trimmed) return invalidInput({ question: 'Question is required' })
    if (!llm) return forbidden('No LLM model is configured')

    const answer = await generateText({
      model: llm,
      prompt: trimmed,
      providerOptions: getProviderOptions(),
    })
    return ok(answer.text)
  },
}

export type AgentService = typeof agentService
