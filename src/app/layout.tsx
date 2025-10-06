import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
