import type { DbClient } from '@/infra/db'

import type { User, UserId } from './model'

const userRepository = {
  getUser: async (db: DbClient, id: string): Promise<User | null> => {
    const user = await db
      .selectFrom('users')
      .select(['id', 'name', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst()
    if (!user) return null
    return { id: user.id as UserId, name: user.name, createdAt: new Date(user.created_at) }
  },
  listUsers: async (db: DbClient): Promise<User[]> => {
    const users = await db
      .selectFrom('users')
      .select(['id', 'name', 'created_at'])
      .orderBy('created_at', 'desc')
      .execute()
    return users.map((user) => ({
      id: user.id as UserId,
      name: user.name,
      createdAt: new Date(user.created_at),
    }))
  },
  insertUser: async (db: DbClient, user: User) => {
    await db
      .insertInto('users')
      .values({ id: user.id, name: user.name, created_at: user.createdAt.toISOString() })
      .execute()
  },
  deleteUser: async (db: DbClient, id: UserId): Promise<boolean> => {
    const result = await db
      .deleteFrom('users')
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()
    return Boolean(result?.id)
  },
}

export default userRepository
