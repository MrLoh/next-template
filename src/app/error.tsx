'use client'

import { useEffect } from 'react'

import { ErrorPage } from '@/components/error'

export default function NextErrorBoundary({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorPage type="BUG" origin="application" digest={error.digest ?? 'unknown'} />
}
