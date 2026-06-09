import { promises as fs } from 'fs'
import * as path from 'path'

import 'dotenv/config'

import { match } from 'ts-pattern'

import {
  createMigrator,
  DATABASE_URL,
  DB_NAME,
  MIGRATIONS_DIR,
  type Migrator,
} from '../db/migrator'
import { logger, prompt } from './helpers'
import { runKyselyCodegen } from './typegen'

const DB_DIR = '../db/types.d.ts'

/**
 * Skip interactive confirmation prompts when invoked with `--yes` / `-y`.
 * Intended for non-interactive callers (CI, agents, scripts).
 */
const skipConfirm = process.argv.includes('--yes') || process.argv.includes('-y')
const confirm = async (message: string): Promise<boolean> =>
  skipConfirm ? true : prompt.confirm(message)

/** List all migrations */
const listMigrations = async (migrator: Migrator) => {
  logger.info('listing migrations...')
  const migrations = await migrator.getMigrations()
  logger.success(`found ${migrations.length} migration${migrations.length === 1 ? '' : 's'}:`)
  const longestName = migrations.reduce((acc, m) => Math.max(acc, m.name.length), 0)
  const dateOptions = { month: '2-digit', day: '2-digit', year: 'numeric' } as const
  migrations.forEach((m) => {
    const formattedCreatedAt = m.createdAt.toLocaleDateString('en-US', dateOptions)
    const formattedName = m.name.padEnd(longestName, ' ')
    const formattedExecutedAt = m.executedAt?.toLocaleString('en-US', {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
    })
    logger.text(
      `${formattedCreatedAt}: ${formattedName} | ${
        m.executedAt ? 'executed: ' + formattedExecutedAt : 'not executed'
      }`,
    )
  })
}

const getResultLoggers = (direction: 'up' | 'down') => {
  return [
    (name: string) =>
      logger.info(
        `migration "${name}" was ${direction === 'up' ? 'applied' : 'reverted'} successfully`,
      ),
    (name: string) =>
      logger.error(`migration "${name}" failed to ${direction === 'up' ? 'apply' : 'revert'}`),
  ]
}

/** Apply all pending migrations */
const migrateToLatest = async (migrator: Migrator) => {
  const start = Date.now()
  const migrations = (await migrator.getMigrations()).filter((m) => !m.executedAt)
  if (migrations.length === 0) {
    logger.warn('No migrations to apply\n')
    return
  }
  logger.info(`applying ${migrations.length} migration${migrations.length === 1 ? '' : 's'}...`)
  await migrator.migrateToLatest(...getResultLoggers('up'))
  logger.success(`successfully migrated to latest version in ${Date.now() - start}ms\n`)
  await runKyselyCodegen(DATABASE_URL, DB_DIR)
}

/** Apply the next migration */
const migrateUp = async (migrator: Migrator) => {
  const start = Date.now()
  const migrations = (await migrator.getMigrations()).filter((m) => !m.executedAt)
  if (migrations.length === 0) {
    logger.warn('No migrations to apply\n')
    return
  }
  logger.info(`applying migration "${migrations[0]!.name}"...`)
  await migrator.migrateUp(...getResultLoggers('up'))
  logger.success(`successfully applied next migration in ${Date.now() - start}ms\n`)
  await runKyselyCodegen(DATABASE_URL, DB_DIR)
}

/** Undo the last migration */
const migrateDown = async (migrator: Migrator) => {
  const start = Date.now()
  const migrations = (await migrator.getMigrations()).filter((m) => m.executedAt)
  if (migrations.length === 0) {
    logger.warn('No migrations to revert\n')
    return
  }
  const confirmed = await confirm(
    `Are you sure you want to revert the "${
      migrations.at(-1)!.name
    }" migration? Some data may be lost!`,
  )
  if (!confirmed) {
    logger.warn('aborted\n')
    return
  }
  logger.info(`reverting migration "${migrations.at(-1)!.name}"...`)
  await migrator.migrateDown(...getResultLoggers('down'))
  logger.success(`successfully reverted last migration in ${Date.now() - start}\n`)
  await runKyselyCodegen(DATABASE_URL, DB_DIR)
}

/** Reapply the last migration */
const reapplyMigration = async (migrator: Migrator) => {
  const start = Date.now()
  const migrations = (await migrator.getMigrations()).filter((m) => m.executedAt)
  if (migrations.length === 0) {
    logger.warn('No migrations to reapply\n')
    return
  }
  const confirmed = await confirm(
    `Are you sure you want to reapply the "${
      migrations.at(-1)!.name
    }" migration? Some data may be lost!`,
  )
  if (!confirmed) {
    logger.warn('aborted\n')
    return
  }
  logger.info(`reapplying migration "${migrations.at(-1)!.name}"...`)
  await migrator.migrateDown(...getResultLoggers('down'))
  await migrator.migrateUp(...getResultLoggers('up'))
  logger.success(`successfully reapplied last migration in ${Date.now() - start}\n`)
  await runKyselyCodegen(DATABASE_URL, DB_DIR)
}

const MIGRATION_TEMPLATE = `import { type Kysely } from 'kysely';

export const up = async (db: Kysely<unknown>): Promise<void> => {
  // TODO: write migration code
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  // TODO: write migration code
}
`

/** Create a new migration file in the migrations folder */
const createMigration = async (migrationName: string) => {
  // create UTC timestamp and format it as YYYYMMDDHHMMSS
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ]/g, '')
    .split('.')[0]
  // create file name as timestamp plus kebab-case name
  const filename = `${timestamp}-${migrationName.toLowerCase().split(' ').join('-')}.ts`
  const filepath = path.join(MIGRATIONS_DIR, filename)
  // create migration file from template
  await fs.writeFile(filepath, MIGRATION_TEMPLATE)
  logger.success(`created migration file: ${filepath}\n`)
}

/** Reset the database to a clean state */
export const resetDatabase = async (migrator: Migrator) => {
  const start = Date.now()
  const confirmed = await confirm(
    `Are you sure you want to reset the "${DB_NAME}" database? All data will be lost!`,
  )
  if (!confirmed) {
    logger.warn('aborted\n')
    process.exit(0)
  }
  logger.info('resetting database...')
  await migrator.resetDatabase()
  logger.success(`successfully reset database: ${DB_NAME} in ${Date.now() - start}ms\n`)
}

if (process.argv[1] === import.meta.filename) {
  ;(async () => {
    if (process.argv[2] === 'create') {
      let migrationName = process.argv[3]
      if (!migrationName) {
        migrationName = await prompt.text('Please enter a name for the migration')
      }
      await createMigration(migrationName)
      process.exit(0)
    }
    const migrator = await createMigrator(true, () =>
      logger.success(`successfully created database: ${DB_NAME}`),
    )
    try {
      await match(process.argv[2])
        .with('list', () => listMigrations(migrator))
        .with('up', () => migrateUp(migrator))
        .with('down', () => migrateDown(migrator))
        .with('latest', () => migrateToLatest(migrator))
        .with('reapply', () => reapplyMigration(migrator))
        .with('reset', () => resetDatabase(migrator))
        .otherwise(() => {
          logger.info('usage:')
          ;[
            'yarn migrate create <migration-name>',
            'yarn migrate list',
            'yarn migrate up',
            'yarn migrate down',
            'yarn migrate latest',
            'yarn migrate reapply',
            'yarn migrate reset',
            '',
            'pass --yes (or -y) to any destructive command to skip confirmation',
            '',
          ].forEach((line) => logger.text(line))
        })
      await migrator.releaseConnection()
      process.exit(0)
    } catch (e) {
      await migrator.releaseConnection()
      logger.error(`failed to migrate\n\n${e}`)
      process.exit(1)
    }
  })()
}
