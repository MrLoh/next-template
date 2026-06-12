'use client'

import { useActionState } from 'react'

import { Button } from '@/components/button'
import { dialog } from '@/components/dialog'
import { showErrorDialog } from '@/components/error'
import { Input } from '@/components/input'
import { answerQuestion } from '@/data'
import type { FormResultWithError } from '@/utils/errors'

export function AskQuestionForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: FormResultWithError<string> | undefined, formData: FormData) => {
      const result = await answerQuestion({ question: String(formData.get('question') ?? '') })
      if (!result.ok) {
        if (result.err.type !== 'INVALID_INPUT') showErrorDialog(result.err)
        return result
      }
      dialog('Answer', result.val)
      return result
    },
    undefined,
  )
  const questionError =
    state && !state.ok && state.err.type === 'INVALID_INPUT'
      ? state.err.fieldErrors.question
      : undefined

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          name="question"
          type="text"
          placeholder="Ask anything..."
          aria-invalid={questionError ? true : undefined}
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Thinking…' : 'Ask'}
        </Button>
      </div>
      {questionError && <p className="text-sm text-destructive">{questionError}</p>}
    </form>
  )
}
