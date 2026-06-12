import { uuid } from '@/utils/crypto'
import { invalidInput, notFound } from '@/utils/errors'
import { ok } from '@/utils/result'

import type { Ctx } from '../context'
import type { UserId } from './model'
import userRepository from './repo'

export const userService = {
  getUser: async ({ db }: Ctx, id: string) => {
    const user = await userRepository.getUser(db, id)
    if (!user) return notFound('User')
    return ok(user)
  },
  listUsers: async ({ db }: Ctx) => {
    return ok(await userRepository.listUsers(db))
  },
  createUser: async ({ db }: Ctx, { name }: { name: string }) => {
    const trimmed = name.trim()
    if (!trimmed) return invalidInput({ name: 'Name is required' })

    const user = { id: uuid<UserId>(), name: trimmed, createdAt: new Date() }
    await userRepository.insertUser(db, user)
    return ok(user)
  },
  deleteUser: async ({ db }: Ctx, id: UserId) => {
    const deleted = await userRepository.deleteUser(db, id)
    if (!deleted) return notFound('User')
    return ok(true)
  },
}

export type UserService = typeof userService
