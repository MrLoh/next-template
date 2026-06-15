import config from '@/config'
import { auth } from '@/infra/auth'
import { testRequest } from '@/test-helpers'

describe('auth', () => {
  it('creates and resolves a session from a cookie', async () => {
    // Given a cookie session
    await auth.setSessionCookie({
      id: 'user-1',
      role: 'patient',
      name: 'alice',
      scopes: ['sleep:read'],
    })

    // Then the principal resolves from the cookie
    const principal = await auth.authenticate()
    expect(principal).toMatchObject({
      id: 'user-1',
      role: 'patient',
      name: 'alice',
      scopes: ['sleep:read'],
    })
  })

  it('creates and resolves a session from a bearer token', async () => {
    // Given a signed token
    const token = await auth.createJwt({ id: 'user-2', role: 'patient', name: 'bob' }, 60_000)
    testRequest.setBearerToken(token)

    // Then the principal matches the token payload
    const principal = await auth.authenticate()
    expect(principal).toMatchObject({ id: 'user-2', role: 'patient', name: 'bob' })
  })

  it('prefers the bearer token over the cookie', async () => {
    // Given a cookie session and a separate bearer token
    await auth.setSessionCookie({ id: 'user-cookie', role: 'patient', name: 'cookie-user' })
    const bearerToken = await auth.createJwt(
      { id: 'user-bearer', role: 'clinician', name: 'bearer-user' },
      60_000,
    )
    testRequest.setBearerToken(bearerToken)

    // Then the bearer token wins
    const principal = await auth.authenticate()
    expect(principal).toMatchObject({ id: 'user-bearer', role: 'clinician', name: 'bearer-user' })
  })

  it('clears the cookie on logout', async () => {
    // Given an active cookie session
    await auth.setSessionCookie({ id: 'user-3', role: 'patient', name: 'carol' })

    // When deleting the session
    const hadCookie = await auth.deleteSessionCookie()

    // Then the cookie is cleared and the session no longer resolves
    expect(hadCookie).toBe(true)
    expect(testRequest.cookies().get(config.SESSION_COOKIE_NAME)).toBeUndefined()
    expect(await auth.authenticate()).toBeNull()
  })

  it('returns null for an invalid token', async () => {
    // Given a bad bearer token
    testRequest.setBearerToken('not-a-jwt')

    // Then nothing is returned
    expect(await auth.authenticate()).toBeNull()
  })
})
