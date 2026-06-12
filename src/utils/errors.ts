/**
 * In Next.js, directly throwing errors during api calls strips important details (because of the way Next catches and serializes the error object).
 * To preserve all relevant error information, always return an error object instead of throwing directly.
 *
 * This file defines the different Error types (along with constructor helper functions for each)
 * to be returned when an error occurs.
 *
 * There is also a shared ErrorPage and Dialog component in src/app/error.tsx that take in the error object as props
 * and shows an appropriate message / call to action.
 *
 * Lastly, our Form component is integrated with zod and automatically handles form errors returned as an InvalidInput type.
 */

import { err, ok, type ErrResult, type Result } from './result'

/** The user is not authenticated and trying to access or act on a non-public resource */
export type Unauthenticated = { type: 'UNAUTHENTICATED' }

/**
 * This constructor creates an Unauthenticated Error Result
 */
export const unauthenticated = (): ErrResult<Unauthenticated> => err({ type: 'UNAUTHENTICATED' })

/**
 * The user may not access or perform the requested action.
 *
 * @remarks
 * Covers missing permissions, business-rule violations, and other cases where the request is
 * understood but cannot be fulfilled. Use `invalidInput` when a specific form field is at fault.
 */
export type Forbidden = {
  type: 'FORBIDDEN'
  /** why the request cannot proceed; omitted on the Next.js forbidden page */
  reason?: string
}

/**
 * This constructor creates a Forbidden Error Result
 * @param reason - why the request cannot proceed
 */
export const forbidden = (reason: string): ErrResult<Forbidden> => {
  console.info('Forbidden', { reason })
  return err({ type: 'FORBIDDEN', reason })
}

/** The requested resource does not exist */
export type NotFound = {
  type: 'NOT_FOUND'
  /** name of the resource that was not found, should use spaces to separate words */
  resource: string
}

/**
 * This constructor creates a Not Found Error Result
 * @param resource - The resource that was not found
 */
export const notFound = (resource: string): ErrResult<NotFound> => {
  console.info(`${resource} not found`)
  return err({ type: 'NOT_FOUND', resource })
}

/** The request can not be fulfilled but retrying later may succeed */
export type Unavailable = {
  type: 'UNAVAILABLE'
  /** name of the service that is temporarily unavailable */
  service: string
}

/**
 * This constructor creates an Unavailable Error Result
 * @param service the name of the service that is temporarily unavailable
 */
export const unavailable = (service: string): ErrResult<Unavailable> => {
  console.error(`${service} unavailable`)
  return err({ type: 'UNAVAILABLE', service })
}

/**
 * Invalid input that can only be detected on the backend was submitted by the user
 *
 * @remarks
 * We only return `InvalidInput` from the server when the input cannot be validated on the frontend,
 * e.g. for validating uniqueness of a field that requires a database query. Otherwise we only
 * validate forms on the frontend and rely on types to ensure that the correct data is passed to the
 * server. We typically do some validation of data before writing to the database, but we do not
 * bother to transform any errors that zod may throw at that point into `InvalidInput` results.
 */
export type InvalidInput<
  // corresponding field name to error message mapping
  F extends string = string,
> = {
  type: 'INVALID_INPUT'
  /** field name to error message mapping */
  fieldErrors: Record<F, string>
}

/**
 * This constructor creates an InvalidInput Error Result
 * @param fieldErrors - mapping from field name to error message
 */
export const invalidInput = <E extends { [fieldName: string]: string }>(
  fieldErrors: E,
  // @ts-expect-error -- typescript does not understand that fieldName is a string
): ErrResult<InvalidInput<keyof E>> => {
  console.info('Invalid input', { fieldErrors })
  return err({ type: 'INVALID_INPUT', fieldErrors })
}

/** A bug that occurred on the server side that should be gracefully handled by the frontend
 * @remarks always call `bug` to create a Bug result and capture sensitive error details */
export type Bug = {
  type: 'BUG'
  /** name of the code area where the bug occurred, should use spaces to separate words */
  origin: string
  /** digest to correlate the logged error on the server with the error that a user may report */
  digest: string
}

/**
 * Create a digest code for a bug
 *
 * @returns an 8 character hex string
 */
export const createDigestCode = () => crypto.getRandomValues(new Uint8Array(4)).join('')

/**
 * Create a Bug result and log the error details on the server
 *
 * @remarks
 * This is used to capture details about unexpected errors that occur on the server side and
 * should be gracefully handled by the frontend. So instead of throwing an error, this function
 * is called to capture the error details on the server and return a bug result to the
 * frontend which is stripped of the message and only contains a digest to correlate the error
 * that a user may report with the log on the server that was captures here.
 *
 * @param origin - where the bug occurred, will be sent to the frontend
 * @param cause - message or caught error to log, this will not be sent to the frontend
 * @returns Bug with digest to correlate the error that a user may report with the log on the server
 */
export const bug = (origin: string, cause: Error | string | unknown): ErrResult<Bug> => {
  const digest = createDigestCode()
  console.error(digest, origin, cause)
  return err({ type: 'BUG', origin, digest })
}

/**
 * Convenience function to wrap a function call in a try/catch
 *
 * @param origin - if a bug occurs, where it occurred from, will be sent to the frontend
 * @param expression - the function to be called in the try/catch
 * @returns Either the OkResult or a BUG ErrorResult
 */
export const catchBug = async <F extends () => Promise<unknown>>(
  origin: string,
  expression: F,
  timeout?: number,
): Promise<Result<Awaited<ReturnType<F>>, Bug>> => {
  try {
    const res = timeout
      ? await Promise.race([
          expression(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timed out after ${timeout} ms`)), timeout),
          ),
        ])
      : await expression()

    return ok(res as Awaited<ReturnType<F>>)
  } catch (e) {
    return bug(origin, e)
  }
}

export type ResultError = Unauthenticated | Forbidden | NotFound | Unavailable | Bug

export type FormResultError = ResultError | InvalidInput

export type FormResultWithError<T> = Result<T, FormResultError>
export type ResultWithError<T> = Result<T, ResultError>
