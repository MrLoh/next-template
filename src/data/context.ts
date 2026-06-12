import { trace } from '@opentelemetry/api'
import { lowerCase } from 'lodash-es'
import { unstable_rethrow } from 'next/navigation'

import { db, llm, type DB, type LanguageModel } from '@/infra'
import { createDigestCode, type Bug } from '@/utils/errors'
import { err, type ErrResult } from '@/utils/result'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- needed for type inference
export type Tail<T extends unknown[]> = T extends [infer _, ...infer Rest] ? Rest : never

export type Ctx = { db: DB; llm: LanguageModel | null }

export type ServiceMethod = (
  ctx: Ctx,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed
  ...args: any[]
) => Promise<unknown>

export type Service = { [key: string]: ServiceMethod }

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
        const ctx: Ctx = { db, llm }

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
