import { mapValues } from 'lodash-es'

import { check, isDraining } from '@/infra'

export const dynamic = 'force-dynamic'

/**
 * Check if the service is healthy.
 *
 * @remarks Used for monitoring service health and not by Kubernetes.
 */
export const GET = async () => {
  const start = performance.now()
  const cds = await check()
  const durations: Record<string, number> = mapValues(cds, ([_, duration]) => duration)
  const checks = mapValues(cds, ([ok]) => ok)
  const draining = isDraining()
  const ok = Object.values(checks).every(Boolean)
  durations.total = Math.floor(performance.now() - start)
  return Response.json({ ok, checks, durations, draining }, { status: ok ? 200 : 500 })
}
