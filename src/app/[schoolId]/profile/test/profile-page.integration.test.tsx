/**
 * Profile Page Integration Tests
 * Tests the actual component behavior with proper mocking
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import React from 'react';

// Mock the dependencies at the top level
const mockGetUserSession = jest.fn();
const mockGetUserById = jest.fn();
const mockGetGroupsBySchool = jest.fn();

// Mock modules before any imports
jest.mock('@/lib/auth/session', () => ({
  getUserSession: mockGetUserSession,
}));

jest.mock('@/lib/handlers/users-handler', () => ({
  getUserById: mockGetUserById,
}));

jest.mock('@/lib/handlers/groups-handler', () => ({
  getGroupsBySchool: mockGetGroupsBySchool,
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...(props as Record<string, unknown>)}>{children}</a>;
  };
});

jest.mock('@/components/ui', () => ({
  Card: ({ children, elevation, ...props }: { children: React.ReactNode; elevation?: number; [key: string]: unknown }) => (
    <div data-elevation={elevation} {...(props as Record<string, unknown>)}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...(props as Record<string, unknown>)}>{children}</div>
  ),
  CardTitle: ({ children, level, ...props }: { children: React.ReactNode; level?: number; [key: string]: unknown }) => (
    <h2 data-level={level} {...(props as Record<string, unknown>)}>{children}</h2>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...(props as Record<string, unknown>)}>{children}</div>
  ),
}));

describe('ProfilePage Integration', () => {
  const mockUser = {
    uid: 'user123',
    email: 'user@example.com',
    displayName: 'John Doe',
    role: 'user' as const,
    schoolId: 'school123',
    groupIds: ['group1', 'group2'],
    createdAt: { toDate: () => new Date('2023-01-01') },
  };

  const mockGroups = [
    {
      groupId: 'group1',
      name: 'Class 5A',
      description: 'Primary school class 5A',
    },
    {
      groupId: 'group2',
      name: 'Math Club',
      description: 'After-school math activities',
    },
  ];

  beforeAll(() => {
    // Set up default successful user session
    mockGetUserSession.mockResolvedValue({
      uid: 'user123',
      schoolId: 'school123',
      role: 'user',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and render profile page successfully', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    // Dynamic import to ensure mocks are in place
    const { default: ProfilePage } = await import('../page');
    
    // This should not throw if authentication is working
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    expect(Page).toBeDefined();

    // Render the page
    render(Page);

    // Verify key elements are present
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('School Information')).toBeInTheDocument();
    expect(screen.getByText('Group Memberships')).toBeInTheDocument();
  });

  it('should display user personal information correctly', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    // Check personal information
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    
    // Check data attributes
    expect(screen.getByTestId('user-email')).toHaveAttribute('data-user-email', 'user@example.com');
    expect(screen.getByTestId('user-display-name')).toHaveAttribute('data-user-display-name', 'John Doe');
    expect(screen.getByTestId('user-role')).toHaveAttribute('data-user-role', 'user');
  });

  it('should display school information correctly', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    expect(screen.getByText('school123')).toBeInTheDocument();
    
    // Check data attributes
    expect(screen.getByTestId('school-id')).toHaveAttribute('data-school-id', 'school123');
  });

  it('should display user groups correctly', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    expect(screen.getByText('Class 5A')).toBeInTheDocument();
    expect(screen.getByText('Math Club')).toBeInTheDocument();
    expect(screen.getByText('Primary school class 5A')).toBeInTheDocument();
    expect(screen.getByText('After-school math activities')).toBeInTheDocument();
    
    // Check data attributes
    expect(screen.getByTestId('group-group1')).toHaveAttribute('data-group-id', 'group1');
    expect(screen.getByTestId('group-group1')).toHaveAttribute('data-group-name', 'Class 5A');
  });

  it('should show empty state when user has no groups', async () => {
    mockGetUserById.mockResolvedValue({
      ...mockUser,
      groupIds: [],
    });
    mockGetGroupsBySchool.mockResolvedValue([]);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    expect(screen.getByText('You are not currently assigned to any groups.')).toBeInTheDocument();
  });

  it('should handle missing display name', async () => {
    mockGetUserById.mockResolvedValue({
      ...mockUser,
      displayName: null,
    });
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    expect(screen.queryByTestId('user-display-name')).not.toBeInTheDocument();
  });

  it('should have proper navigation links', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    const noticesLink = screen.getByText('Notices');
    expect(noticesLink.closest('a')).toHaveAttribute('href', '/school123/notices');

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should include page metadata for parser', async () => {
    mockGetUserById.mockResolvedValue(mockUser);
    mockGetGroupsBySchool.mockResolvedValue(mockGroups);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    const metadataDiv = screen.getByTestId('page-metadata');
    expect(metadataDiv).toHaveAttribute('data-page-type', 'user-profile');
    expect(metadataDiv).toHaveAttribute('data-portal-version', '1.0.0');
    expect(metadataDiv).toHaveAttribute('data-user-id', 'user123');
    expect(metadataDiv).toHaveAttribute('data-school-id', 'school123');
    expect(metadataDiv).toHaveAttribute('aria-hidden', 'true');
  });

  it('should handle user not found', async () => {
    mockGetUserById.mockResolvedValue(null);

    const { default: ProfilePage } = await import('../page');
    const Page = await ProfilePage({ params: { schoolId: 'school123' } });
    render(Page);

    expect(screen.getByText('Profile not found')).toBeInTheDocument();
    expect(screen.getByText('Your profile information could not be found.')).toBeInTheDocument();
  });
});

describe('ProfilePage Authentication', () => {
  it('should throw error when user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const { default: ProfilePage } = await import('../page');
    
    await expect(ProfilePage({ params: { schoolId: 'school123' } }))
      .rejects.toThrow('Access denied: Authentication required');
  });

  it('should throw error when user does not have school access', async () => {
    mockGetUserSession.mockResolvedValue({
      uid: 'user123',
      schoolId: 'different-school',
      role: 'user',
    });

    const { default: ProfilePage } = await import('../page');
    
    await expect(ProfilePage({ params: { schoolId: 'school123' } }))
      .rejects.toThrow('Access denied: School access required');
  });

  it('should allow admin users to access any school', async () => {
    mockGetUserSession.mockResolvedValue({
      uid: 'admin123',
      schoolId: 'admin-school',
      role: 'admin',
    });
    mockGetUserById.mockResolvedValue({
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin' as const,
      schoolId: 'admin-school',
      groupIds: [],
      createdAt: { toDate: () => new Date('2023-01-01') },
    });
    mockGetGroupsBySchool.mockResolvedValue([]);

    const { default: ProfilePage } = await import('../page');
    
    // This should not throw
    const Page = await ProfilePage({ params: { schoolId: 'different-school' } });
    expect(Page).toBeDefined();
  });
});