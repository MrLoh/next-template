import { trace } from '@opentelemetry/api'
import { lowerCase } from 'lodash-es'
import { unstable_rethrow } from 'next/navigation'

import { createDbClient, sql, type DbClient } from '@/infra/db'
import { catchBug, createDigestCode, type Bug } from '@/utils/errors'
import { err, type ErrResult } from '@/utils/result'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- needed for type inference
export type Tail<T extends unknown[]> = T extends [infer _, ...infer Rest] ? Rest : never

export type Ctx = { db: DbClient }

export type ServiceMethod = (
  ctx: Ctx,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed
  ...args: any[]
) => Promise<unknown>

export type Service = { [key: string]: ServiceMethod }

const db = createDbClient()

/**
 * Middleware to inject context into services and catch unhandled errors.
 *
 * This adds a context with the database connection to each service function call.
 * It also catches unhandled errors from service functions and transforms them into bugs,
 * and adds tracing for each service method.
 *
 * @param name - name of the service
 * @param service - the service to wrap
 *
 * @returns a mirror of the service with the wrapped methods
 */
const withContext = <S extends Service>(name: string, service: S) => {
  const tracer = trace.getTracer(name)

  return new Proxy(service, {
    get: (target, prop, receiver) => {
      const serviceMethod = Reflect.get(target, prop, receiver)
      if (typeof serviceMethod !== 'function') return serviceMethod
      const serviceMethodName = String(prop)

      return async (...args: unknown[]) => {
        const ctx: Ctx = { db }

        return tracer.startActiveSpan(serviceMethodName, async (span) => {
          try {
            return await serviceMethod(ctx, ...args)
          } catch (e) {
            unstable_rethrow(e)
            const digest = createDigestCode()
            const origin = lowerCase(serviceMethodName)
            console.error(digest, `${name}.${origin}`, e)
            return err({ type: 'BUG', origin, digest } satisfies Bug)
          } finally {
            span.end()
          }
        })
      }
    },
  }) as unknown as {
    [K in keyof S]: (
      ...args: Tail<Parameters<S[K]>>
    ) => Promise<Awaited<ReturnType<S[K]>> | ErrResult<Bug>>
  }
}

export default withContext

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
