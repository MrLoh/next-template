import { ErrorPage } from '@/components/error'

export default function Unauthorized() {
  return <ErrorPage type="UNAUTHENTICATED" />
}
