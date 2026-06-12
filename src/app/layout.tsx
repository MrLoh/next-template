import { Geist_Mono, Inter } from 'next/font/google'

import './globals.css'

import { DialogProvider } from '@/components/dialog'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/utils/styling'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
    >
      <body>
        <ThemeProvider>
          <DialogProvider>{children}</DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
