import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'MySchool - School Portal Testbed',
  description: 'A testbed application for testing MySchools App integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
