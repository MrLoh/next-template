import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

import config from '@/config'

import type { DB } from '../../db/types'

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.DATABASE_POOL_SIZE,
  idleTimeoutMillis: config.DATABASE_POOL_TIMEOUT,
})

pool.on('error', (e) => {
  console.error('postgres pool error', e)
})

export const createDbClient = () => new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })

export type DbClient = ReturnType<typeof createDbClient>
export { sql } from 'kysely'
