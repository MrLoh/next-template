import type { DbClient } from "@/db"
import type { User, UserId } from "./model"

export const createUserRepository = (db: DbClient) => {
  return {
    getUser: async (id: string): Promise<User | null> => {
      const user = await db
        .selectFrom("users")
        .select(["id", "name", "created_at"])
        .where("id", "=", id)
        .executeTakeFirst()
      if (!user) return null
      return {
        id: user.id as UserId,
        name: user.name,
        createdAt: new Date(user.created_at),
      }
    },
    listUsers: async (): Promise<User[]> => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name", "created_at"])
        .orderBy("created_at", "desc")
        .execute()
      return users.map((user) => ({
        id: user.id as UserId,
        name: user.name,
        createdAt: new Date(user.created_at),
      }))
    },
    createUser: async (user: User) => {
      await db
        .insertInto("users")
        .values({
          id: user.id,
          name: user.name,
          created_at: user.createdAt.toISOString(),
        })
        .execute()
    },
    deleteUser: async (id: UserId): Promise<boolean> => {
      const result = await db
        .deleteFrom("users")
        .where("id", "=", id)
        .returning("id")
        .executeTakeFirst()
      return Boolean(result?.id)
    },
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
