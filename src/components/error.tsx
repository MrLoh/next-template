'use client'

import { useRouter } from 'next/navigation'
import { match } from 'ts-pattern'

import { Button } from '@/components/button'
import { type ResultError } from '@/utils/errors'
import { formatSentence } from '@/utils/formatting'

const getErrorContent = (error: ResultError) =>
  match(error)
    .with({ type: 'UNAUTHENTICATED' }, () => ({
      title: 'Login required',
      description: 'You need to log in to access this page.',
    }))
    .with({ type: 'FORBIDDEN' }, (e) => ({
      title: 'Unable to proceed',
      description: e.reason ? formatSentence(e.reason) : 'This request cannot be completed.',
    }))
    .with({ type: 'NOT_FOUND' }, (e) => ({
      title: 'Not found',
      description: `The ${e.resource} you are looking for does not exist.`,
    }))
    .with({ type: 'UNAVAILABLE' }, (e) => ({
      title: 'Service unavailable',
      description: `${e.service} seems to be temporarily unavailable. Please try again later.`,
    }))
    .with({ type: 'BUG' }, (e) => ({
      title: 'Unexpected error',
      description: `An unexpected error occurred in the ${e.origin}.`,
    }))
    .exhaustive()

export const ErrorPage = (error: ResultError) => {
  const router = useRouter()
  const { title, description } = getErrorContent(error)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="text-lg font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {error.type === 'BUG' && (
          <p className="text-xs text-muted-foreground">
            {error.origin} · {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
          {error.type === 'UNAVAILABLE' && (
            <Button type="button" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
