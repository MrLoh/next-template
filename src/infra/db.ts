import { Kysely, PostgresDialect, type Selectable } from 'kysely'
import { Pool } from 'pg'

import config from '@/config'

import type { DbTypes } from '../../db/types'

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.DATABASE_POOL_SIZE,
  idleTimeoutMillis: config.DATABASE_POOL_TIMEOUT,
})

pool.on('error', (e) => {
  console.error('postgres pool error', e)
})

export type DB = Kysely<DbTypes>
export type Row<T extends keyof DbTypes & string> = Selectable<DbTypes[T]>

export const createDbClient = () => new Kysely<DbTypes>({ dialect: new PostgresDialect({ pool }) })

export { sql } from 'kysely'
