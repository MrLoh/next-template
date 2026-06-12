'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'
import { match } from 'ts-pattern'

import { Button } from '@/components/button'
import { dialog, type DialogButtonConfig } from '@/components/dialog'
import { type ResultError } from '@/utils/errors'
import { formatSentence } from '@/utils/formatting'

type ErrorContent = {
  title: string
  body: ReactNode
  /** Extra actions beyond the default page/dialog dismiss buttons (e.g. Refresh). */
  buttons?: DialogButtonConfig[]
}

const getErrorContent = (error: ResultError): ErrorContent =>
  match(error)
    .with({ type: 'UNAUTHENTICATED' }, () => ({
      title: 'Login required',
      body: 'You need to log in to access this page.',
    }))
    .with({ type: 'FORBIDDEN' }, (e) => ({
      title: 'Unable to proceed',
      body: e.reason ? formatSentence(e.reason) : 'This request cannot be completed.',
    }))
    .with({ type: 'NOT_FOUND' }, (e) => ({
      title: 'Not found',
      body: `The ${e.resource} you are looking for does not exist.`,
    }))
    .with({ type: 'UNAVAILABLE' }, (e) => ({
      title: 'Service unavailable',
      body: `${e.service} seems to be temporarily unavailable. Please try again later.`,
      buttons: [{ label: 'Refresh', onClick: () => window.location.reload() }],
    }))
    .with({ type: 'BUG' }, (e) => ({
      title: 'Unexpected error',
      body: (
        <>
          {`An unexpected error occurred in the ${e.origin}.`}
          <p className="mt-3 text-xs text-muted-foreground">
            {e.origin} · {e.digest}
          </p>
        </>
      ),
    }))
    .exhaustive()

export const showErrorDialog = (error: ResultError) => {
  const content = getErrorContent(error)
  dialog({
    title: content.title,
    body: content.body,
    buttons: [...(content.buttons ?? []), { label: 'OK' }],
  })
}

export const ErrorPage = (error: ResultError) => {
  const router = useRouter()
  const content = getErrorContent(error)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="text-lg font-medium">{content.title}</h1>
        <div className="text-sm text-muted-foreground">{content.body}</div>
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
          {content.buttons?.map((button) => (
            <Button
              key={button.label}
              type="button"
              variant={button.variant}
              onClick={button.onClick}
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
