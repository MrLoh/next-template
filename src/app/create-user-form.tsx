'use client'

import { useRouter } from 'next/navigation'
import { useActionState } from 'react'

import { Button } from '@/components/button'
import { createUser, type User } from '@/data'
import type { FormResultWithError } from '@/utils/errors'

export function CreateUserForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    async (_prev: FormResultWithError<User> | undefined, formData: FormData) => {
      const result = await createUser({ name: String(formData.get('name') ?? '') })
      if (result.ok) router.refresh()
      return result
    },
    undefined,
  )
  const nameError =
    state && !state.ok && state.err.type === 'INVALID_INPUT'
      ? state.err.fieldErrors.name
      : undefined

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          placeholder="Name"
          aria-invalid={nameError ? true : undefined}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </div>
      {nameError && <p className="text-sm text-destructive">{nameError}</p>}
    </form>
  )
}
