/**
 * Sample REST API -- /api
 *
 * Procedures are declared here; OpenAPI wiring lives in `@/helpers/openapi`.
 */

import { os } from '@orpc/server'
import { z } from 'zod'

import { getCurrentUser } from '@/data'
import { userSchema } from '@/data/users/models'
import { createOpenAPIRouteHandler, fromResult } from '@/helpers/openapi'
import { ok } from '@/utils/result'

const ping = os
  .route({ method: 'GET', path: '/ping', summary: 'Ping the API' })
  .output(z.string())
  .handler(async () => fromResult(ok('pong')))

const me = os
  .route({ method: 'GET', path: '/me', summary: 'Get the current user' })
  // drop the branding transform on `id` so the spec generates; `createdAt` stays a
  // `Date` (the handler's value) and serializes to an ISO string on the wire
  .output(userSchema.extend({ id: z.uuid() }))
  .handler(async () => fromResult(await getCurrentUser()))

export const router = { ping, me }

export const handleRequest = createOpenAPIRouteHandler(router, {
  prefix: '/api',
  title: 'next-template API',
})

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as PATCH,
  handleRequest as DELETE,
}
