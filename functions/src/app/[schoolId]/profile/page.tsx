/**
 * User Profile Page - MySchool Application
 *
 * Server-rendered page displaying user profile information.
 * HTML structure designed for parsing by Flutter adapter.
 * Updated to use the formalized design system and improve accessibility.
 */

import { getUserSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/handlers/users-handler';
import { getGroupsBySchool } from '@/lib/handlers/groups-handler';
import React from 'react';

// Temporary basic components to avoid client-side import issues
interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: number;
  [key: string]: unknown;
}

const Card = ({ children, className, elevation = 1, ...props }: CardProps) => (
  <div className={`surface rounded-medium shadow-elevation-${elevation} ${className || ''}`} {...props}>
    {children}
  </div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => (
  <div className={`px-6 pt-6 pb-4 ${className || ''}`} {...props}>
    {children}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  [key: string]: unknown;
}

const CardTitle = ({ children, level = 3, className, ...props }: CardTitleProps) => {
  const TitleTag = `h${level}` as const;
  return (
    <TitleTag className={`title-large text-on-surface font-medium mb-1 ${className || ''}`} {...props}>
      {children}
    </TitleTag>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  [key: string]: unknown;
}

const CardContent = ({ children, className, padded = true, ...props }: CardContentProps) => (
  <div className={`${padded ? 'px-6 pb-6' : 'px-6'} ${className || ''}`} {...props}>
    {children}
  </div>
);
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profile - MySchool',
  description: 'View your profile information',
};

interface ProfilePageProps {
  params: {
    schoolId: string;
  };
}

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { schoolId } = params;

  console.log(`[ProfilePage] Rendering profile page for schoolId: ${schoolId}`);

  // Get user session (middleware already handled authorization)
  const session = await getUserSession();
  console.log(`[ProfilePage] Session:`, session ? { 
    uid: session.uid, 
    email: session.email, 
    schoolId: session.schoolId,
    groupIds: session.groupIds,
    role: session.role,
    displayName: session.displayName
  } : 'No session');

  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session) {
    throw new Error('Access denied: Authentication required');
  }

  // Verify user has access to this school
  if (session.schoolId !== schoolId && session.role !== 'admin') {
    throw new Error('Access denied: School access required');
  }

  // Fetch user data
  console.log(`[ProfilePage] Fetching user with UID: ${session.uid}`);
  const user = await getUserById(session.uid);
  console.log(`[ProfilePage] Fetched user:`, user ? { uid: user.uid, email: user.email, groupIds: user.groupIds } : 'Not found');

  if (!user) {
    return (
      <div className="min-h-screen surface flex items-center justify-center">
        <div className="text-center" role="alert">
          <h1 className="headline-large text-on-surface">
            Profile not found
          </h1>
          <p className="body-large text-on-surface-variant mt-4">
            Your profile information could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Fetch groups for the school
  const groups = await getGroupsBySchool(user.schoolId);

  // Filter user's groups
  const userGroups = groups.filter(group => user.groupIds?.includes(group.groupId));

  return (
    <>
      {/* Page metadata for parser */}
      <div
        data-testid="page-metadata"
        data-page-type="user-profile"
        data-portal-version="1.0.0"
        data-timestamp={new Date().toISOString()}
        data-user-id={user.uid}
        data-school-id={schoolId}
        className="hidden"
        aria-hidden="true"
      />

      <div className="min-h-screen background">
        {/* Header with AppBar-like structure */}
        <header 
          className="surface elevation-2 sticky top-0 z-40"
          role="banner"
        >
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <h1 className="headline-large text-on-surface">
                My Profile
              </h1>
              <nav 
                className="flex items-center gap-6"
                role="navigation"
                aria-label="Page navigation"
              >
                <Link
                  href={`/${schoolId}/notices`}
                  className="text-primary hover:text-primary-container font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Notices
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="text-error hover:text-error-container font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 rounded"
                  >
                    Logout
                  </button>
                </form>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main 
          className="max-w-4xl mx-auto px-6 py-8"
          role="main"
        >
          <div className="space-y-8">
            {/* Personal Information Card */}
            <Card elevation={1}>
              <CardHeader>
                <CardTitle level={2} className="text-on-surface">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="user-email"
                      className="label-medium text-on-surface-variant block mb-2"
                    >
                      Email Address
                    </label>
                    <p
                      id="user-email"
                      className="body-large text-on-surface"
                      data-testid="user-email"
                      data-user-email={user.email}
                    >
                      {user.email}
                    </p>
                  </div>

                  {user.displayName && (
                    <div>
                      <label 
                        htmlFor="user-display-name"
                        className="label-medium text-on-surface-variant block mb-2"
                      >
                        Display Name
                      </label>
                      <p
                        id="user-display-name"
                        className="body-large text-on-surface"
                        data-testid="user-display-name"
                        data-user-display-name={user.displayName}
                      >
                        {user.displayName}
                      </p>
                    </div>
                  )}

                  <div>
                    <label 
                      htmlFor="user-role"
                      className="label-medium text-on-surface-variant block mb-2"
                    >
                      Role
                    </label>
                    <p
                      id="user-role"
                      className="body-large text-on-surface"
                      data-testid="user-role"
                      data-user-role={user.role}
                    >
                      {user.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                  </div>

                  <div>
                    <label 
                      htmlFor="account-created"
                      className="label-medium text-on-surface-variant block mb-2"
                    >
                      Account Created
                    </label>
                    <p 
                      id="account-created"
                      className="body-large text-on-surface"
                    >
                      {user.createdAt?.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* School Information Card */}
            <Card elevation={1}>
              <CardHeader>
                <CardTitle level={2} className="text-on-surface">
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="school-id"
                      className="label-medium text-on-surface-variant block mb-2"
                    >
                      School ID
                    </label>
                    <p
                      id="school-id"
                      className="body-large text-on-surface"
                      data-testid="school-id"
                      data-school-id={user.schoolId}
                    >
                      {user.schoolId}
                    </p>
                  </div>

                  <div>
                    <label 
                      htmlFor="member-since"
                      className="label-medium text-on-surface-variant block mb-2"
                    >
                      Member Since
                    </label>
                    <p 
                      id="member-since"
                      className="body-large text-on-surface"
                    >
                      {user.createdAt?.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Memberships Card */}
            <Card elevation={1}>
              <CardHeader>
                <CardTitle level={2} className="text-on-surface">
                  Group Memberships
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userGroups.length === 0 ? (
                  <p 
                    className="body-large text-on-surface-variant"
                    role="status"
                    aria-live="polite"
                  >
                    You are not currently assigned to any groups.
                  </p>
                ) : (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    role="list"
                    aria-label="Your group memberships"
                  >
                    {userGroups.map((group) => (
                      <div
                        key={group.groupId}
                        className="surface-variant rounded-medium p-4 border border-outline/20"
                        data-testid={`group-${group.groupId}`}
                        data-group-id={group.groupId}
                        data-group-name={group.name}
                        role="listitem"
                      >
                        <h3 className="title-medium text-on-surface-variant mb-1">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="body-medium text-on-surface-variant/70">
                            {group.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}