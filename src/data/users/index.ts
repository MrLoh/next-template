import { uuid } from '@/utils/crypto'
import { invalidInput, unauthenticated } from '@/utils/errors'
import { ok } from '@/utils/result'

import type { Ctx } from '../context'
import userRepository from './repository'

export const userService = {
  signUp: async ({ db, auth }: Ctx, { name }: { name: string }) => {
    name = name.trim()
    if (!name) return invalidInput({ name: 'Username is required' })

    if (await userRepository.findByName(db, name)) {
      return invalidInput({ name: 'Username is already taken' })
    }

    const user = { id: uuid(), name, role: 'patient' as const, createdAt: new Date() }
    await userRepository.insertUser(db, user)
    await auth.setSessionCookie(user)

    return ok(user)
  },

  signIn: async ({ db, auth }: Ctx, { name }: { name: string }) => {
    name = name.trim()
    if (!name) return invalidInput({ name: 'Username is required' })

    const user = await userRepository.findByName(db, name)
    if (!user) return invalidInput({ name: 'Unknown username' })

    await auth.setSessionCookie(user)
    return ok(user)
  },

  signOut: async ({ auth }: Ctx) => {
    await auth.deleteSessionCookie()
    return ok(true)
  },

  getCurrentUser: async ({ auth, db }: Ctx) => {
    if (!auth.principal) return unauthenticated()
    const user = await userRepository.getUser(db, auth.principal.id)
    if (!user) return unauthenticated()
    return ok(user)
  },
}

export type UserService = typeof userService
