import { sql, type Kysely } from 'kysely'

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.createType('user_role').asEnum(['patient', 'clinician']).execute()

  await db.schema
    .alterTable('users')
    .addColumn('role', sql`user_role`, (col) => col.notNull().defaultTo('patient'))
    .execute()
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.alterTable('users').dropColumn('role').execute()
  await db.schema.dropType('user_role').execute()
}
