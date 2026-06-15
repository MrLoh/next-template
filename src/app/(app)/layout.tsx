import { getCurrentUser } from '@/data'
import { unwrap } from '@/utils/unwrap'

import { LogoutButton } from '../logout-button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await unwrap(getCurrentUser())
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">Sleep dashboard</p>
        </div>
        <LogoutButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
