import SQLite from "better-sqlite3"
import { Kysely, SqliteDialect } from "kysely"
import config from "@/config"
import type { DB } from "./types"

const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new SQLite(config.DATABASE_PATH),
  }),
})

export type DbClient = typeof db
export { sql } from "kysely"

export default db
