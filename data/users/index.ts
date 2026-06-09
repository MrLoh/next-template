import { uuid } from "@/utils/crypto"
import { invalidInput, type FormResultWithError } from "@/utils/errors"
import { ok } from "@/utils/result"
import type { UserRepository } from "./repo"
import type { User, UserId } from "./model"

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
    deleteUser: async (id: UserId) => repo.deleteUser(id),
  }
}

export type UserService = ReturnType<typeof createUserService>
