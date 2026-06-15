import { OpenAPIGenerator } from '@orpc/openapi'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError, ORPCError, type AnyRouter, type HTTPPath } from '@orpc/server'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { match } from 'ts-pattern'

import type { ResultError, ResultWithError } from '@/utils/errors'

const toORPCError = (error: ResultError): ORPCError<string, unknown> =>
  match(error)
    .with({ type: 'UNAUTHENTICATED' }, () => new ORPCError('UNAUTHORIZED'))
    .with(
      { type: 'FORBIDDEN' },
      (e) => new ORPCError('FORBIDDEN', { message: e.reason ?? 'Forbidden' }),
    )
    .with(
      { type: 'NOT_FOUND' },
      (e) => new ORPCError('NOT_FOUND', { message: `${e.resource} not found` }),
    )
    .with(
      { type: 'UNAVAILABLE' },
      (e) =>
        new ORPCError('SERVICE_UNAVAILABLE', {
          message: `${e.service} is temporarily unavailable`,
        }),
    )
    .with({ type: 'BUG' }, () => new ORPCError('INTERNAL_SERVER_ERROR'))
    .exhaustive()

/** Unwrap a service `Result` at the API boundary, throwing a typed `ORPCError` on failure. */
export const fromResult = <T>(result: ResultWithError<T>): T => {
  if (result.ok) return result.val
  throw toORPCError(result.err)
}

type OpenAPIRouteHandlerOptions = {
  prefix: HTTPPath
  title: string
  version?: string
  specPath?: HTTPPath
  docsPath?: HTTPPath
}

/** Generate an OpenAPI spec from a router (for tests and tooling). */
export const generateOpenAPISpec = (router: AnyRouter, info: { title: string; version?: string }) =>
  new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] }).generate(router, {
    info: { version: '1.0.0', ...info },
  })

/** Wire an oRPC router into a Next.js route handler with OpenAPI spec and Scalar docs. */
export const createOpenAPIRouteHandler = (
  router: AnyRouter,
  {
    prefix,
    title,
    version = '1.0.0',
    specPath = '/openapi.json',
    docsPath = '/docs',
  }: OpenAPIRouteHandlerOptions,
) => {
  const handler = new OpenAPIHandler(router, {
    customErrorResponseBodyEncoder: (error) => ({ error: error.message }),
    plugins: [
      new OpenAPIReferencePlugin({
        specPath,
        docsPath,
        schemaConverters: [new ZodToJsonSchemaConverter()],
        specGenerateOptions: { info: { title, version } },
      }),
    ],
    interceptors: [onError((error) => console.error('API', error))],
  })

  return async (request: Request) => {
    const { matched, response } = await handler.handle(request, { prefix, context: {} })
    if (matched) return response
    return Response.json({ error: 'Endpoint not found' }, { status: 404 })
  }
}
