import type { DB } from '@/infra/db'

import type { User, UserId } from './models'

const userRepository = {
  getUser: async (tx: DB, id: string): Promise<User | null> => {
    const user = await tx
      .selectFrom('users')
      .select(['id', 'name', 'role', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst()
    if (!user) return null
    return {
      id: user.id as UserId,
      name: user.name,
      role: user.role,
      createdAt: new Date(user.created_at),
    }
  },

  findByName: async (tx: DB, name: string): Promise<User | null> => {
    const user = await tx
      .selectFrom('users')
      .select(['id', 'name', 'role', 'created_at'])
      .where('name', '=', name)
      .executeTakeFirst()
    if (!user) return null
    return {
      id: user.id as UserId,
      name: user.name,
      role: user.role,
      createdAt: new Date(user.created_at),
    }
  },

  insertUser: async (tx: DB, user: User) => {
    await tx
      .insertInto('users')
      .values({
        id: user.id,
        name: user.name,
        role: user.role,
        created_at: user.createdAt.toISOString(),
      })
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
