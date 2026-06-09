'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/button'
import { deleteUser, type UserId } from '@/data'

export function DeleteUserButton({ id }: { id: UserId }) {
  const router = useRouter()

  return (
    <form
      action={async () => {
        await deleteUser(id)
        router.refresh()
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  )
}
