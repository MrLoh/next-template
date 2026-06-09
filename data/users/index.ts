import { uuid } from "@/utils/crypto"
import { invalidInput, notFound } from "@/utils/errors"
import { ok } from "@/utils/result"
import type { UserRepository } from "./repo"
import type { UserId } from "./model"

export const createUserService = (repo: UserRepository) => {
  return {
    getUser: async (id: string) => repo.getUser(id),
    listUsers: async () => repo.listUsers(),
    createUser: async ({ name }: { name: string }) => {
      const trimmed = name.trim()
      if (!trimmed) return invalidInput({ name: "Name is required" })

      const user = {
        id: uuid<UserId>(),
        name: trimmed,
        createdAt: new Date(),
      }
      await repo.createUser(user)
      return ok(user)
    },
    deleteUser: async (id: UserId) => {
      const deleted = await repo.deleteUser(id)
      if (!deleted) return notFound("User")
      return ok(true)
    },
  }
}

export type UserService = ReturnType<typeof createUserService>
