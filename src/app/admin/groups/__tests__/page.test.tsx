/**
 * Admin Groups Management Page Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

// Mock the dependencies before importing the component
const mockGetUserSession = jest.fn();
const mockGetAllGroups = jest.fn();
const mockGetAllSchools = jest.fn();

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

// Import the component after mocking
import AdminGroupsPage from '../page';

describe('AdminGroupsPage', () => {
  const mockSession = {
    email: 'admin@example.com',
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders groups management page with data', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'school-a',
        description: 'Fifth grade class A',
      },
      {
        groupId: 'art-club',
        name: 'Art Club',
        schoolId: 'school-a',
        description: 'After school art activities',
      },
    ];

    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
      },
    ];

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('Manage Groups')).toBeInTheDocument();
    expect(screen.getByText('School Groups & Classes')).toBeInTheDocument();
    expect(screen.getByText('Grade 5A')).toBeInTheDocument();
    expect(screen.getByText('Art Club')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Elementary')).toBeInTheDocument(); // School name should be displayed
  });

  it('renders empty state when no groups exist', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue([]);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('No groups found. Create your first group.')).toBeInTheDocument();
  });

  it('displays school ID when school name not found', async () => {
    const mockGroups = [
      {
        groupId: 'grade-5a',
        name: 'Grade 5A',
        schoolId: 'unknown-school',
        description: 'Fifth grade class A',
      },
    ];

    const mockSchools = []; // No schools

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('unknown-school')).toBeInTheDocument();
  });

  it('has proper data attributes for parsing', async () => {
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

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const Page = await AdminGroupsPage();
    render(Page);

    // Check group row data attributes
    const groupRow = screen.getByText('Grade 5A').closest('tr');
    expect(groupRow).toHaveAttribute('data-group-id', 'grade-5a');
    expect(groupRow).toHaveAttribute('data-group-name', 'Grade 5A');
    expect(groupRow).toHaveAttribute('data-group-school-id', 'school-a');
    expect(groupRow).toHaveAttribute('data-group-description', 'Fifth grade class A');
  });

  it('throws error when user is not admin', async () => {
    mockGetUserSession.mockResolvedValue(null);

    await expect(AdminGroupsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('throws error when user role is not admin', async () => {
    mockGetUserSession.mockResolvedValue({
      email: 'user@example.com',
      role: 'user',
    });

    await expect(AdminGroupsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('displays create new group button', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue([]);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminGroupsPage();
    render(Page);

    const createButton = screen.getByText('Create New Group');
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/admin/groups/create');
  });

  it('displays back to dashboard link', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue([]);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminGroupsPage();
    render(Page);

    const backLink = screen.getByText('← Back to Dashboard');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/admin/dashboard');
  });

  it('handles groups without descriptions', async () => {
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

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const Page = await AdminGroupsPage();
    render(Page);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});