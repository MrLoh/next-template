import { z } from 'zod'

export type UserId = string

export const userRoleSchema = z.enum(['patient', 'clinician'])

export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: userRoleSchema,
  createdAt: z.date(),
})

export type User = z.infer<typeof userSchema>
