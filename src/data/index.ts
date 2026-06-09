'use server'

import db from '@/infra/db'

import { createUserService } from './users'
import { createUserRepository } from './users/repo'

export const { getUser, listUsers, createUser, deleteUser } = createUserService(
  createUserRepository(db),
)

export type { User, UserId } from './users/model'
