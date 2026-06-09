import { promises as fs } from 'fs'
import * as path from 'path'
import { Kysely, PostgresDialect } from 'kysely'
import {
  FileMigrationProvider,
  Migrator as KyselyMigrator,
  type MigrationResultSet,
} from 'kysely/migration'
import * as pg from 'pg'

// NOTE: keep this module self-contained — it's compiled and run in isolation
// in the Docker image (see Dockerfile `migrations-builder`/`runner` stages),
// so it must not import `@/config`, `dotenv`, or other app dependencies.
export const DATABASE_URL =
  // eslint-disable-next-line no-process-env -- migrator runs standalone, before app config is available
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/next_template'

export const DB_NAME = DATABASE_URL.split('/').pop()
if (!DB_NAME) {
  throw new Error('invalid DATABASE_URL environment variable')
}

export const MIGRATIONS_DIR = path.join(import.meta.dirname, '../db/migrations')

export const createMigrator = async (adminEnabled?: boolean, onDatabaseCreated?: () => void) => {
  let adminDbClient: pg.Client | undefined

  if (adminEnabled) {
    adminDbClient = new pg.Client({
      connectionString: DATABASE_URL.replace(new RegExp(`/${DB_NAME}$`), '/postgres'),
    })
    await adminDbClient.connect()
  }

  const checkIfDatabaseExists = () =>
    adminDbClient!
      .query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`)
      .then((res) => res.rowCount! > 0)

  // ensure the database exists
  if (adminEnabled && !(await checkIfDatabaseExists())) {
    await adminDbClient!.query(`CREATE DATABASE ${DB_NAME}`)
    onDatabaseCreated?.()
  }

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: DATABASE_URL, max: 1 }) }),
  })

  const migrator = new KyselyMigrator({
    db,
    provider: new FileMigrationProvider({ fs, path, migrationFolder: MIGRATIONS_DIR }),
    migrationLockTableName: 'migrations_lock',
    migrationTableName: 'migrations',
    migrationTableSchema: 'migrations',
  })

  const handleResult = (
    { results, error }: MigrationResultSet,
    onMigrationSucceeded?: (name: string) => void,
    onMigrationFailed?: (name: string) => void,
  ) => {
    results?.forEach((res) => {
      const [, ...nameParts] = res.migrationName.split('-')
      const name = nameParts.join(' ')
      if (res.status === 'Success') onMigrationSucceeded?.(name)
      else if (res.status === 'Error') onMigrationFailed?.(name)
    })
    if (error) throw error
  }

  return {
    /**
     * Release the database connection of the migrator
     */
    releaseConnection: async () => {
      await adminDbClient?.end()
      await db.destroy()
    },
    /**
     * Reset the database by dropping and recreating it
     */
    resetDatabase: async () => {
      if (!adminEnabled) throw new Error('admin is not enabled')

      if (await checkIfDatabaseExists()) {
        await adminDbClient!.query(
          `SELECT pg_terminate_backend(pid)
           FROM pg_stat_activity
           WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid()`,
        )
        await adminDbClient!.query(`DROP DATABASE ${DB_NAME}`)
      }
      await adminDbClient!.query(`CREATE DATABASE ${DB_NAME}`)
    },
    /**
     * Get a list of all migrations both applied and not applied
     *
     * @returns list of migrations with name, createdAt, and executedAt
     */
    getMigrations: async () => {
      const migrations = await migrator.getMigrations()
      return migrations.map((m) => {
        const [createdAtString, ...nameParts] = m.name.split('-')
        const name = nameParts.join(' ')
        const createdAt = new Date(
          [
            [
              createdAtString?.substring(0, 4),
              createdAtString?.substring(4, 6),
              createdAtString?.substring(6, 8),
            ].join('-'),
            [
              createdAtString?.substring(8, 10),
              createdAtString?.substring(10, 12),
              createdAtString?.substring(12, 14),
            ].join(':'),
          ].join('T'),
        )
        return { name, createdAt, executedAt: m.executedAt }
      })
    },
    /**
     * Migrate up to the next version
     *
     * @param onMigrationSucceeded - called for each migration that was successfully applied
     * @param onMigrationFailed - called for each migration that failed to apply
     */
    migrateUp: async (
      onMigrationSucceeded?: (name: string) => void,
      onMigrationFailed?: (name: string) => void,
    ) => {
      handleResult(await migrator.migrateUp(), onMigrationSucceeded, onMigrationFailed)
    },
    /**
     * Migrate down to the previous version
     *
     * @param onMigrationSucceeded - called for each migration that was successfully applied
     * @param onMigrationFailed - called for each migration that failed to apply
     */
    migrateDown: async (
      onMigrationSucceeded?: (name: string) => void,
      onMigrationFailed?: (name: string) => void,
    ) => {
      handleResult(await migrator.migrateDown(), onMigrationSucceeded, onMigrationFailed)
    },
    /**
     * Migrate to the latest version
     *
     * @param onMigrationSucceeded - called for each migration that was successfully applied
     * @param onMigrationFailed - called for each migration that failed to apply
     */
    migrateToLatest: async (
      onMigrationSucceeded?: (name: string) => void,
      onMigrationFailed?: (name: string) => void,
    ) => {
      handleResult(await migrator.migrateToLatest(), onMigrationSucceeded, onMigrationFailed)
    },
  }
}

export type Migrator = Awaited<ReturnType<typeof createMigrator>>

// this allows running the migrator as a script in production to migrate to the latest version
if (process.argv[1] === import.meta.filename) {
  ;(async () => {
    // eslint-disable-next-line no-console -- this is a script
    console.log('migrating database...')
    const start = Date.now()
    const migrator = await createMigrator()
    try {
      const nm = (await migrator.getMigrations()).filter((m) => !m.executedAt).length
      if (nm === 0) {
        // eslint-disable-next-line no-console -- this is a script
        console.log('• No migrations to apply\n')
        await migrator.releaseConnection()
        process.exit(0)
      }
      // eslint-disable-next-line no-console -- this is a script
      console.log(`• applying ${nm} migration${nm === 1 ? '' : 's'}...`)
      await migrator.migrateToLatest(
        // eslint-disable-next-line no-console -- this is a script
        (name) => console.log(`✓ "${name}" applied successfully`),
        // eslint-disable-next-line no-console -- this is a script
        (name) => console.error(`✗ "${name}" failed to apply`),
      )
      // eslint-disable-next-line no-console -- this is a script
      console.log(`✓ successfully migrated to latest version in ${Date.now() - start}ms\n`)
      await migrator.releaseConnection()
      process.exit(0)
    } catch (e) {
      await migrator.releaseConnection()
      // eslint-disable-next-line no-console -- this is a script
      console.error(`✗ failed migrate ${(e as Error).message}`)
      process.exit(1)
    }
  })()
}
