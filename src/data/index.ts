'use server'

import { agentService } from './agent'
import withContext from './context'
import { userService } from './users'

export const { getUser, listUsers, createUser, deleteUser } = withContext('users', userService)
export const { answerQuestion } = withContext('agent', agentService)

export type { User, UserId } from './users/model'
