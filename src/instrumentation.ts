export const register = async () => {
  // skip instrumentation during production build to avoid side effects
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Lifecycle handlers: Next.js manages process exit itself, so we only flip flags and close clients.
    const { onShutdownStart, onShutdownFinish } = await import('@/infra')
    process.on('SIGINT', () => onShutdownStart())
    process.on('SIGTERM', () => onShutdownStart())
    process.on('beforeExit', async () => {
      await onShutdownFinish()
    })
  }
}
