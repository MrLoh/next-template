/**
 * Provides a set of utility types and functions for handling results of computations that may
 * succeed or fail. It is designed to make error handling more explicit and safer by wrapping
 * results in a `Result` type similar to Rust.
 *
 * @remarks
 * This is copied from a personal MIT licensed project https://github.com/MrLoh/event-sync
 */
import { err, ok } from './result'

describe('ok', () => {
  it('creates an ok result', () => {
    // When calling ok with a value
    const res = ok('test')
    // Then the result should be an ok result
    expect(res).toMatchObject({ ok: true, err: undefined })
    // And the result should have the correct value
    expect(res.val).toBe('test')
  })
})

describe('err', () => {
  it('creates an err result when called with an object', () => {
    // When calling err with a result error object
    const res = err({ type: 'UNAUTHENTICATED' })
    // Then the result should be an err result
    expect(res).toMatchObject({ ok: false, val: undefined })
    // And the error in the result should be the object
    expect(res.err).toEqual({ type: 'UNAUTHENTICATED' })
  })

  it('throws an error when called with an invalid argument', () => {
    // When calling err with a random argument
    expect(() => err(1)).toThrow(
      // Then an error should be thrown
      'err expects an object, string, Error, or Error class as an argument',
    )
    // When calling err with a class that is not an error
    expect(() => err(class Test {})).toThrow(
      // Then an error should be thrown
      'err expects an object, string, Error, or Error class as an argument',
    )
  })
})
