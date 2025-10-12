/**
 * Admin Groups Management Page - MySchool Application
 *
 * Client-rendered page for managing groups with proper authentication.
 * HTML structure designed for parsing by Flutter adapter.
 */

import AdminGroupsClientPage from './client-page';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manage Groups - MySchool Admin',
  description: 'Create and manage school groups and classes',
};

export default function AdminGroupsPage() {
  return <AdminGroupsClientPage />;
}