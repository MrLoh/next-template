export const dynamic = 'force-dynamic'

/**
 * Check if the instance is alive.
 *
 * @remarks Kubernetes will restart the pod if this fails. Should not perform any checks.
 */
export const GET = async () => {
  return Response.json({ ok: true }, { status: 200 })
}
