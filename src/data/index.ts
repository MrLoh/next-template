'use server'

import withContext from './context'
import { userService } from './users'

export const { getUser, listUsers, createUser, deleteUser } = withContext('users', userService)

export type { User, UserId } from './users/model'
