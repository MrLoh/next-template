import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthForm } from './auth-form'

type LoginPageProps = { searchParams: Promise<{ new?: string }> }

export async function generateMetadata({ searchParams }: LoginPageProps): Promise<Metadata> {
  const isRegister = (await searchParams).new !== undefined
  return { title: isRegister ? 'Registration' : 'Login' }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const isRegister = (await searchParams).new !== undefined

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-lg font-medium">{isRegister ? 'Registration' : 'Login'}</h1>
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? 'Pick a username to create your account.'
              : 'Enter your username to access your account.'}
          </p>
        </div>
        <AuthForm isRegister={isRegister} />
        <p className="text-sm text-muted-foreground">
          {isRegister ? 'Already have an account? ' : 'No account? '}
          <Link
            href={isRegister ? '/login' : '/login?new'}
            className="text-foreground underline underline-offset-4"
          >
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </p>
      </div>
    </div>
  )
}
