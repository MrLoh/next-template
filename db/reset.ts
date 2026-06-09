import fs from "node:fs"
import SQLite from "better-sqlite3"
import { Cli as KyselyCodegenCli } from "kysely-codegen"
import config from "../config"

const DB_PATH = config.DATABASE_PATH
const SCHEMA_PATH = "db/schema.sql"
const TYPES_PATH = "db/types.d.ts"

fs.rmSync(DB_PATH, { force: true })

const sqlite = new SQLite(DB_PATH)
const schema = fs.readFileSync(SCHEMA_PATH, "utf8")
sqlite.exec(schema)
sqlite.close()
console.log(`Rebuilt ${DB_PATH} from schema.sql`)

await new KyselyCodegenCli().generate({
  url: DB_PATH,
  outFile: TYPES_PATH,
  dialect: "sqlite",
  camelCase: false,
  typeOnlyImports: true,
  logLevel: "warn",
  print: false,
})
console.log(`Generated ${TYPES_PATH}`)
