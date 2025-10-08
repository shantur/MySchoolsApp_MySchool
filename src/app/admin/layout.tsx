/**
 * Admin Layout - MySchool Application
 * 
 * Provides error boundaries and common layout for all admin pages.
 */

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}