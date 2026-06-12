import { isDraining } from '@/infra'

export const dynamic = 'force-dynamic'

/**
 * Check if the instance is ready to receive traffic.
 *
 * @remarks Kubernetes will stop routing traffic to the instance if this fails.
 * Should only check dependencies that would completely break the service.
 */
export const GET = async () => {
  const draining = isDraining()
  const ok = !draining
  return Response.json({ ok, draining }, { status: ok ? 200 : 503 })
}
