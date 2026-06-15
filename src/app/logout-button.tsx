'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/button'
import { signOut } from '@/data'

export function LogoutButton() {
  const router = useRouter()

  return (
    <form
      action={async () => {
        await signOut()
        router.push('/login')
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Log out
      </Button>
    </form>
  )
}
