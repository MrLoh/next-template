import { cookies, headers } from 'next/headers'
import z from 'zod'

import config from '@/config'
import { signJwt, verifyJwt } from '@/utils/crypto'

const SCOPES = ['sleep:read', 'sleep:write'] as const

export const scopeSchema = z.enum(SCOPES)

export type Scope = z.infer<typeof scopeSchema>

export const principalSchema = z.object({
  id: z.string(),
  role: z.enum(['patient', 'clinician', 'partner']),
  name: z.string(),
  scopes: z.array(scopeSchema).default([]),
})

export type Principal = z.infer<typeof principalSchema>

const createJwt = async (
  principal: Omit<Principal, 'scopes'> & { scopes?: Scope[] },
  maxAge: number,
): Promise<string> => {
  return await signJwt(
    { sub: principal.id, role: principal.role, name: principal.name, scopes: principal.scopes },
    maxAge,
  )
}

const parseJwt = async (token: string): Promise<Principal | null> => {
  const payload = await verifyJwt(token)
  if (!payload) return null
  const { success, data: principal } = principalSchema.safeParse({
    id: payload.sub,
    role: payload.role,
    name: payload.name,
    scopes: payload.scopes,
  })
  if (!success) return null
  return principal
}

export const auth = {
  createJwt,

  setSessionCookie: async (
    principal: Omit<Principal, 'scopes'> & { scopes?: Scope[] },
  ): Promise<void> => {
    const token = await createJwt(
      { ...principal, scopes: principal.scopes ?? [] },
      config.SESSION_MAX_AGE,
    )
    const cookieStore = await cookies()
    cookieStore.set(config.SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: config.NODE_ENV === 'production',
      maxAge: config.SESSION_MAX_AGE / 1_000,
    })
  },

  deleteSessionCookie: async (): Promise<boolean> => {
    const cookieStore = await cookies()
    const hadCookie = Boolean(cookieStore.get(config.SESSION_COOKIE_NAME)?.value)
    cookieStore.delete(config.SESSION_COOKIE_NAME)
    return hadCookie
  },

  authenticate: async (): Promise<Principal | null> => {
    const jwt =
      (await headers()).get('authorization')?.replace(/^Bearer\s+/i, '') ??
      (await cookies()).get(config.SESSION_COOKIE_NAME)?.value
    if (!jwt) return null
    return await parseJwt(jwt)
  },
}

export type Auth = typeof auth
