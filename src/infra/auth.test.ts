import { auth, type CookieStore, type HeaderStore } from '@/infra/auth'

const createCookieStore = () => {
  const cookies = new Map<string, string>()
  const store: CookieStore = {
    get: (name) => {
      const value = cookies.get(name)
      return value ? { name, value } : undefined
    },
    set: (name, value) => {
      cookies.set(name, value)
    },
    delete: (name) => {
      cookies.delete(name)
    },
  }
  return store
}

const createHeaderStore = (authorization?: string): HeaderStore => ({
  get: (name) => (name.toLowerCase() === 'authorization' ? (authorization ?? null) : null),
})

describe('sessionProvider', () => {
  it('creates and resolves a session from a cookie', async () => {
    // Given a cookie store
    const cookies = createCookieStore()

    // When creating a session
    await auth.setSessionCookie(cookies, {
      kind: 'user',
      id: 'user-1',
      displayName: 'alice',
      scopes: ['sleep:read'],
    })

    // Then the principal resolves from the cookie
    const principal = await auth.authenticate({ cookies, headers: createHeaderStore() })
    expect(principal).toMatchObject({
      kind: 'user',
      id: 'user-1',
      displayName: 'alice',
      scopes: ['sleep:read'],
    })
  })

  it('creates and resolves a session from a bearer token', async () => {
    // Given a signed token
    const cookies = createCookieStore()
    const token = await auth.setSessionCookie(cookies, {
      kind: 'user',
      id: 'user-2',
      displayName: 'bob',
      scopes: [],
    })

    // When resolving from the Authorization header
    const principal = await auth.authenticate({
      cookies: createCookieStore(),
      headers: createHeaderStore(`Bearer ${token}`),
    })

    // Then the principal matches the token payload
    expect(principal).toMatchObject({ kind: 'user', id: 'user-2', displayName: 'bob' })
  })

  it('prefers the bearer token over the cookie', async () => {
    // Given a cookie session and a separate bearer token
    const cookies = createCookieStore()
    await auth.setSessionCookie(cookies, {
      kind: 'user',
      id: 'user-cookie',
      displayName: 'cookie-user',
      scopes: [],
    })
    const bearerToken = await auth.setSessionCookie(createCookieStore(), {
      kind: 'user',
      id: 'user-bearer',
      displayName: 'bearer-user',
      scopes: [],
    })

    // When both are present
    const principal = await auth.authenticate({
      cookies,
      headers: createHeaderStore(`Bearer ${bearerToken}`),
    })

    // Then the bearer token wins
    expect(principal).toMatchObject({ kind: 'user', id: 'user-bearer', displayName: 'bearer-user' })
  })

  it('clears the cookie on logout', async () => {
    // Given an active cookie session
    const cookies = createCookieStore()
    await auth.setSessionCookie(cookies, {
      kind: 'user',
      id: 'user-3',
      displayName: 'carol',
      scopes: [],
    })

    // When expiring the session
    const expired = auth.expireSession(cookies)

    // Then the cookie is cleared and the session no longer resolves
    expect(expired).toBe(true)
    expect(cookies.get('session')).toBeUndefined()
    expect(await auth.authenticate({ cookies, headers: createHeaderStore() })).toBeNull()
  })

  it('returns null for an invalid token', async () => {
    // Given a bad bearer token
    const session = await auth.authenticate({
      cookies: createCookieStore(),
      headers: createHeaderStore('Bearer not-a-jwt'),
    })

    // Then nothing is returned
    expect(session).toBeNull()
  })
})
