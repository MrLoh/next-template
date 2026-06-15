'use client'

import { useRouter } from 'next/navigation'
import { useActionState } from 'react'

import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { signIn, signUp, type User } from '@/data'
import type { FormResultWithError } from '@/utils/errors'

export function AuthForm({ isRegister }: { isRegister: boolean }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    async (_prev: FormResultWithError<User> | undefined, formData: FormData) => {
      const name = String(formData.get('name') ?? '')
      const result = isRegister ? await signUp({ name }) : await signIn({ name })
      if (result.ok) router.push('/')
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
        <Input
          name="name"
          type="text"
          placeholder="Username"
          aria-invalid={nameError ? true : undefined}
          className="-ml-2.5 min-w-0 flex-1"
        />
        <Button type="submit" disabled={pending}>
          {isRegister ? 'Register' : 'Log in'}
        </Button>
      </div>
      {nameError && <p className="text-sm text-destructive">{nameError}</p>}
    </form>
  )
}
