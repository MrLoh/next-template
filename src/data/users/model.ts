import { z } from 'zod'

import type { Nominal } from '@/utils/typing'

export type UserId = Nominal<string, 'UserId'>

export const User = z.object({
  id: z.uuid().transform((val) => val as UserId),
  name: z.string(),
  createdAt: z.date(),
})

export type User = z.infer<typeof User>
