import { randomBytes } from 'crypto'
import { beforeEach, vi } from 'vitest'

import type { User } from '@/data/users/models'
import userRepository from '@/data/users/repository'
import type { DB } from '@/infra/db'

import { TEST_UUID_PATTERN } from '../vitest.setup'

export const createTestUuid = (): string => `${TEST_UUID_PATTERN}${randomBytes(6).toString('hex')}`

export const createTestUser = async (db: DB, overrides: Partial<User> = {}): Promise<User> => {
  const user: User = {
    id: createTestUuid(),
    name: createTestUuid(),
    role: 'patient',
    createdAt: new Date(),
    ...overrides,
  }
  await userRepository.insertUser(db, user)
  return user
}

export const isTestUuid = (id: string): boolean => id.startsWith(TEST_UUID_PATTERN)

/**
 * `next/headers` only resolves inside a Next request scope, so the data/auth stack can't
 * read cookies or headers in tests. Mock it once here and back it with in-memory stores
 * that each test can populate (e.g. set an `authorization` header before hitting the API),
 * letting the rest of the stack — auth/JWT, data actions, repositories — run for real.
 */

export type TestHeaderStore = {
  get: (name: string) => string | null
  set: (name: string, value: string) => void
  delete: (name: string) => void
  clear: () => void
}

export type TestCookieStore = {
  get: (name: string) => { name: string; value: string } | undefined
  has: (name: string) => boolean
  set: (name: string, value: string) => void
  delete: (name: string) => void
  getAll: () => { name: string; value: string }[]
  clear: () => void
}

const createTestHeaderStore = (): TestHeaderStore => {
  const map = new Map<string, string>()
  const key = (name: string) => name.toLowerCase()
  return {
    get: (name) => map.get(key(name)) ?? null,
    set: (name, value) => void map.set(key(name), value),
    delete: (name) => void map.delete(key(name)),
    clear: () => map.clear(),
  }
}

const createTestCookieStore = (): TestCookieStore => {
  const jar = new Map<string, string>()
  return {
    get: (name) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    has: (name) => jar.has(name),
    set: (name, value) => void jar.set(name, value),
    delete: (name) => void jar.delete(name),
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    clear: () => jar.clear(),
  }
}

const requestState = vi.hoisted(() => {
  let headers: TestHeaderStore | null = null
  let cookies: TestCookieStore | null = null
  return {
    bind: (h: TestHeaderStore, c: TestCookieStore) => {
      headers = h
      cookies = c
    },
    getHeaders: () => {
      if (!headers) throw new Error('next/headers headers() ran before the test request was bound')
      return Promise.resolve(headers)
    },
    getCookies: () => {
      if (!cookies) throw new Error('next/headers cookies() ran before the test request was bound')
      return Promise.resolve(cookies)
    },
  }
})

vi.mock('next/headers', () => ({
  headers: () => requestState.getHeaders(),
  cookies: () => requestState.getCookies(),
}))

let headers = createTestHeaderStore()
let cookies = createTestCookieStore()

beforeEach(() => {
  headers = createTestHeaderStore()
  cookies = createTestCookieStore()
  requestState.bind(headers, cookies)
})

/** Per-test handle to the mocked `next/headers` request stores. */
export const testRequest = {
  headers: () => headers,
  cookies: () => cookies,
  setBearerToken: (token: string) => headers.set('authorization', `Bearer ${token}`),
}
