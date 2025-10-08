/**
 * Admin Groups Management Page Integration Tests
 * Tests the actual component behavior with proper mocking
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import React from 'react';

// Mock the dependencies at the top level
const mockGetUserSession = jest.fn();
const mockGetAllGroups = jest.fn();
const mockGetAllSchools = jest.fn();

// Mock modules before any imports
jest.mock('@/lib/auth/session', () => ({
  getUserSession: mockGetUserSession,
}));

jest.mock('@/lib/handlers/groups-handler', () => ({
  getAllGroups: mockGetAllGroups,
}));

jest.mock('@/lib/handlers/schools-handler', () => ({
  getAllSchools: mockGetAllSchools,
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...(props as Record<string, unknown>)}>{children}</a>;
  };
});

describe('AdminGroupsPage Integration', () => {
  const mockSession = {
    email: 'admin@example.com',
    role: 'admin',
  };

  beforeAll(() => {
    // Set up default successful admin session
    mockGetUserSession.mockResolvedValue(mockSession);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and render groups page successfully', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'school-a',
        description: 'Fifth grade class A',
      },
    ];

    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
      },
    ];

    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    // Dynamic import to ensure mocks are in place
    const { default: AdminGroupsPage } = await import('../page');
    
    // This should not throw if authentication is working
    const Page = await AdminGroupsPage();
    expect(Page).toBeDefined();

    // Render the page
    render(Page);

    // Verify key elements are present
    expect(screen.getByText('Manage Groups')).toBeInTheDocument();
    expect(screen.getByText('School Groups & Classes')).toBeInTheDocument();
    expect(screen.getByText('Grade 5A')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Elementary')).toBeInTheDocument();
  });

  it('should show empty state when no groups exist', async () => {
    mockGetAllGroups.mockResolvedValue([]);
    mockGetAllSchools.mockResolvedValue([]);

    const { default: AdminGroupsPage } = await import('../page');
    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('No groups found. Create your first group.')).toBeInTheDocument();
  });

  it('should display school ID when school name not found', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'unknown-school',
        description: 'Fifth grade class A',
      },
    ];

    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue([]); // No schools

    const { default: AdminGroupsPage } = await import('../page');
    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('unknown-school')).toBeInTheDocument();
  });

  it('should have proper navigation links', async () => {
    mockGetAllGroups.mockResolvedValue([]);
    mockGetAllSchools.mockResolvedValue([]);

    const { default: AdminGroupsPage } = await import('../page');
    const Page = await AdminGroupsPage();
    render(Page);

    const createButton = screen.getByText('Create New Group');
    expect(createButton.closest('a')).toHaveAttribute('href', '/admin/groups/create');

    const backLink = screen.getByText('← Back to Dashboard');
    expect(backLink.closest('a')).toHaveAttribute('href', '/admin/dashboard');
  });

  it('should include data attributes for group rows', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'school-a',
        description: 'Fifth grade class A',
      },
    ];

    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
      },
    ];

    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const { default: AdminGroupsPage } = await import('../page');
    const Page = await AdminGroupsPage();
    render(Page);

    const groupRow = screen.getByText('Grade 5A').closest('tr');
    expect(groupRow).toHaveAttribute('data-group-id', 'grade-5a');
    expect(groupRow).toHaveAttribute('data-group-name', 'Grade 5A');
    expect(groupRow).toHaveAttribute('data-group-school-id', 'school-a');
    expect(groupRow).toHaveAttribute('data-group-description', 'Fifth grade class A');
  });

  it('should handle groups without descriptions', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'school-a',
        description: '',
      },
    ];

    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
      },
    ];

    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const { default: AdminGroupsPage } = await import('../page');
    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});

describe('AdminGroupsPage Authentication', () => {
  it('should throw error when user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const { default: AdminGroupsPage } = await import('../page');
    
    await expect(AdminGroupsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('should throw error when user is not admin', async () => {
    mockGetUserSession.mockResolvedValue({
      email: 'user@example.com',
      role: 'user',
    });

    const { default: AdminGroupsPage } = await import('../page');
    
    await expect(AdminGroupsPage()).rejects.toThrow('Access denied: Admin access required');
  });
});