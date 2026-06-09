import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Parses a human-friendly duration (e.g. `"100ms"`, `"30s"`, `"5m"`, `"1h"`)
 * into milliseconds. A bare number is treated as milliseconds.
 */
const duration = z
  .string()
  .trim()
  .transform((val, ctx) => {
    const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i.exec(val)
    if (!match) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid duration "${val}" (expected e.g. "100ms", "30s", "5m")`,
      })
      return z.NEVER
    }
    const DURATION_UNIT_MS = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const
    const unit = (match[2]?.toLowerCase() ?? 'ms') as keyof typeof DURATION_UNIT_MS
    return Math.round(Number(match[1]) * DURATION_UNIT_MS[unit])
  })

const boolean = z.enum(['true', 'false']).transform((val) => val === 'true')

const env = createEnv({
  shared: { NODE_ENV: z.enum(['development', 'test', 'production']).default('development') },
  server: {
    DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/next_template'),
    // Postgres pool tuning. Leave unset to use the NODE_ENV-based defaults
    // resolved below; override in prod to match the database's limits.
    DATABASE_POOL_SIZE: z.coerce.number().int().positive().optional(),
    DATABASE_POOL_TIMEOUT: duration.optional(),
    SERVER_SECRET: z.string().default('0'.repeat(64)), // regenerate with `openssl rand -hex 32`
  },
  runtimeEnv: process.env as Record<string, string | undefined>,
})

const config = {
  ...env,
  // Cap connections per instance. Override via env to match the database's
  // limits; otherwise bump in prod and keep tiny elsewhere so several instances
  // don't exhaust Postgres' `max_connections`.
  DATABASE_POOL_SIZE: env.DATABASE_POOL_SIZE ?? (env.NODE_ENV === 'production' ? 10 : 2),
  // Next.js hot reloads in dev spin up fresh modules constantly; release idle
  // connections quickly outside prod so we don't run out of slots.
  DATABASE_POOL_TIMEOUT:
    env.DATABASE_POOL_TIMEOUT ?? (env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 10 * 1000),
}

export default config
