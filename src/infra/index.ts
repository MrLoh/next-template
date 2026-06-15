import { createDbClient, sql } from '@/infra/db'
import { createLanguageModel, type LLM } from '@/infra/llm'
import { catchBug } from '@/utils/errors'

export const db = createDbClient()
export const llm = createLanguageModel()
export type { DB } from '@/infra/db'
export type { LLM as LanguageModel }
export { type Principal, type Scope, auth, type Auth } from '@/infra/auth'

let draining = false

/**
 * Called when shutdown starts (e.g. SIGINT/SIGTERM). Sets the instance to inactive.
 */
export const onShutdownStart = (): void => {
  draining = true
}

/**
 * Called when shutdown finishes (e.g. beforeExit). Reuses existing clients and closes them.
 */
export const onShutdownFinish = async (): Promise<void> => {
  await catchBug('db shutdown', () => db.destroy(), 2000)
}

/**
 * Returns whether the instance is draining.
 */
export const isDraining = (): boolean => draining

/**
 * Runs the requested health checks.
 *
 * @param checks - list of checks to run, or `undefined` to run all.
 * @returns object with results (`true`: ok, `false`: failed, `undefined`: skipped).
 */
export const check = async (
  checks?: ('active' | 'db' | 'homepage')[],
): Promise<{ [check: string]: [boolean, number] }> => {
  const runCheck = async (
    name: 'active' | 'db' | 'homepage',
    executeCheck: () => Promise<unknown>,
    timeout: number,
  ): Promise<[boolean, number] | undefined> => {
    const start = performance.now()
    if (checks !== undefined && !checks.includes(name)) return undefined
    const res = await catchBug(`${name} check`, executeCheck, timeout)
    return [res.ok, Math.floor(performance.now() - start)]
  }

  const [activeOk, dbOk, homepageOk] = await Promise.all([
    runCheck(
      'active',
      async () => {
        if (draining) throw new Error('Instance is draining')
        return true
      },
      100,
    ),
    runCheck('db', () => sql`SELECT 1`.execute(db), 1000),
    runCheck(
      'homepage',
      async () => {
        const res = await fetch('http://localhost:3000')
        const content = await res.text()
        if (res.status !== 200 || !content.includes('</html>')) {
          throw new Error(`homepage ${res.status}: ${content}`)
        }
        return true
      },
      5000,
    ),
  ])

  const result: { [check: string]: [boolean, number] } = {}
  if (activeOk !== undefined) result.active = activeOk
  if (dbOk !== undefined) result.db = dbOk
  if (homepageOk !== undefined) result.homepage = homepageOk
  return result
}
