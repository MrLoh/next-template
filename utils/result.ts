export type ErrResult<E> = {
  /** indicates the success or failure */
  ok: false
  /** value that resulted from a successful execution */
  val: undefined
  /** error that resulted from a failed execution */
  err: E
}

export type OkResult<D> = {
  /** indicates the success or failure */
  ok: true
  /** value that resulted from a successful execution */
  val: D
  /** error that resulted from a failed execution */
  err: undefined
}

/** A type that represents the result of a function that may succeed or fail. */
export type Result<D, E> = OkResult<D> | ErrResult<E>

/** A type that represents the result of an asynchronous function that may succeed or fail. */
export type PromiseResult<D, E> = Promise<Result<D, E>>

/**
 * Creates an ok result.
 *
 * @param val - the value to wrap in an ok result
 * @returns the ok result
 */
export const ok = <D>(val: D): OkResult<D> => {
  return { ok: true, val, err: undefined }
}

/**
 * Creates a not ok result.
 *
 * @param err - the error result type object
 * @returns the err result
 */
export const err = <E>(input: E): ErrResult<E> => {
  if (
    typeof input === "object" &&
    input !== null &&
    "type" in input &&
    typeof input.type === "string"
  ) {
    return { ok: false as const, val: undefined, err: input }
  }
  throw new Error(
    "err expects an object, string, Error, or Error class as an argument"
  )
}
