import type { NextConfig } from 'next'
import { withWorkflow } from 'workflow/next'

const nextConfig: NextConfig = {
  output: process.env.DOCKER ? 'standalone' : undefined, // this env var is set from dockerfile
  deploymentId: process.env.DEPLOYMENT_ID,
  typedRoutes: true,
  experimental: { authInterrupts: true },
}

export default withWorkflow(nextConfig)
