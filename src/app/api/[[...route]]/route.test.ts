import { call, ORPCError } from '@orpc/server'

import { generateOpenAPISpec } from '@/helpers/openapi'
import { auth, db } from '@/infra'
import { createTestUser, testRequest } from '@/test-helpers'

import { handleRequest, router } from './route'

describe('API routes', () => {
  afterAll(() => db.destroy())

  describe('ping', () => {
    it('returns pong', async () => {
      // When calling the procedure
      const result = await call(router.ping, undefined)

      // Then the service is healthy
      expect(result).toBe('pong')
    })
  })

  describe('me', () => {
    it('throws when unauthenticated', async () => {
      // When calling without a session
      const error = await call(router.me, undefined).catch((e: unknown) => e)

      // Then the request is rejected
      expect(error).toBeInstanceOf(ORPCError)
      expect(error).toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('returns the current user from the data layer', async () => {
      // Given a real user in the database and a signed token for them
      const user = await createTestUser(db, { createdAt: new Date('2026-01-01T00:00:00.000Z') })
      const token = await auth.createJwt({ id: user.id, role: user.role, name: user.name }, 60_000)
      testRequest.setBearerToken(token)

      // When calling with a valid session
      const result = await call(router.me, undefined)

      // Then the persisted user is returned
      expect(result).toEqual(user)
    })
  })

  describe('OpenAPI spec', () => {
    it('documents the registered routes', async () => {
      // When generating the spec
      const spec = await generateOpenAPISpec(router, { title: 'next-template API' })

      // Then it includes the procedures
      expect(spec.openapi).toMatch(/^3\.1/)
      expect(Object.keys(spec.paths ?? {})).toEqual(expect.arrayContaining(['/ping', '/me']))
    })
  })

  describe('HTTP handler', () => {
    it('returns 404 for unknown routes', async () => {
      // When requesting an unknown path
      const res = await handleRequest(new Request('http://test/api/does-not-exist'))

      // Then not found is returned
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: 'Endpoint not found' })
    })
  })
})
