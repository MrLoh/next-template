import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const config = createEnv({
  server: {
    DATABASE_PATH: z.string().default("db/app.db"),
  },
  runtimeEnv: process.env as Record<string, string | undefined>,
})

export default config
