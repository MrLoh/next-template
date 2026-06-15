import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'

import config from '@/config'

import type { DbTypes } from './db/types'

/** UUID prefix spelling "test" in hex — marks rows created by tests. */
export const TEST_UUID_PATTERN = '74657374-0000-4000-a000-'

export const setup = async () => {}

export const teardown = async () => {
  const pool = new Pool({ connectionString: config.DATABASE_URL, max: 1 })
  const db = new Kysely<DbTypes>({ dialect: new PostgresDialect({ pool }) })

  try {
    await db
      .deleteFrom('users')
      .where(sql<string>`id::text`, 'like', `${TEST_UUID_PATTERN}%`)
      .execute()
  } finally {
    await db.destroy()
  }
}
