import { CommandIcon, LogOutIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/button'
import { getCurrentUser, signOut } from '@/data'
import { unwrap } from '@/utils/unwrap'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await unwrap(getCurrentUser())

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-muted/40 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CommandIcon className="size-4" />
            </span>
            Demo
          </Link>

          <div className="flex items-center gap-1.5">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm leading-tight font-medium">{user.name}</p>
              <p className="truncate text-xs leading-tight text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase"
            >
              {user.name.slice(0, 1)}
            </span>
            <form
              action={async () => {
                'use server'
                await signOut()
                redirect('/login')
              }}
            >
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Log out">
                <LogOutIcon />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
