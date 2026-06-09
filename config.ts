import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const config = createEnv({
  server: {
    DATABASE_PATH: z.string().default("db/app.db"),
    SERVER_SECRET: z.string().default("0".repeat(64)), // regenerate with `openssl rand -hex 32`
  },
  runtimeEnv: process.env as Record<string, string | undefined>,
})

export default config
