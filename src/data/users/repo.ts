import type { DB } from '@/infra/db'

import type { User, UserId } from './model'

const userRepository = {
  getUser: async (tx: DB, id: string): Promise<User | null> => {
    const user = await tx
      .selectFrom('users')
      .select(['id', 'name', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst()
    if (!user) return null
    return { id: user.id as UserId, name: user.name, createdAt: new Date(user.created_at) }
  },
  listUsers: async (tx: DB): Promise<User[]> => {
    const users = await tx
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
  insertUser: async (tx: DB, user: User) => {
    await tx
      .insertInto('users')
      .values({ id: user.id, name: user.name, created_at: user.createdAt.toISOString() })
      .execute()
  },
  deleteUser: async (tx: DB, id: UserId): Promise<boolean> => {
    const result = await tx
      .deleteFrom('users')
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()
    return Boolean(result?.id)
  },
}

export default userRepository
