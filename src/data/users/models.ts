import { z } from 'zod'

import type { Nominal } from '@/utils/typing'

export type UserId = Nominal<string, 'UserId'>

export const userRoleSchema = z.enum(['patient', 'clinician'])

export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.uuid().transform((val) => val as UserId),
  name: z.string(),
  role: userRoleSchema,
  createdAt: z.date(),
})

export type User = z.infer<typeof userSchema>
