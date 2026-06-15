import { forbidden, notFound, unauthorized } from 'next/navigation'
import { match } from 'ts-pattern'

import type { ResultError, ResultWithError } from './errors'

/**
 * Unwrap a server action result in a page, delegating errors to Next.js handlers.
 */
export const unwrap = async <T>(resultPromise: Promise<ResultWithError<T>>): Promise<T> => {
  const result = await resultPromise
  if (result.ok) return result.val
  return match(result.err satisfies ResultError)
    .with({ type: 'UNAUTHENTICATED' }, () => unauthorized())
    .with({ type: 'FORBIDDEN' }, () => forbidden())
    .with({ type: 'NOT_FOUND' }, () => notFound())
    .with({ type: 'UNAVAILABLE' }, () => {
      throw new Error('Unavailable')
    })
    .with({ type: 'BUG' }, (e) => {
      throw Object.assign(new Error(e.origin), { digest: e.digest })
    })
    .exhaustive()
}
