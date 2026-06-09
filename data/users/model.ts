import type { Nominal } from "@/utils/typing"
import { z } from "zod"

export type UserId = Nominal<string, "UserId">

export const User = z.object({
  id: z.uuid().transform((val) => val as UserId),
  name: z.string(),
  createdAt: z.date(),
})

export type User = z.infer<typeof User>
