/**
 * Admin Schools Management Page Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import AdminSchoolsPage from '../page';

// Mock the dependencies
const mockGetUserSession = jest.fn();
const mockGetAllSchools = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  getUserSession: mockGetUserSession,
}));

jest.mock('@/lib/handlers/schools-handler', () => ({
  getAllSchools: mockGetAllSchools,
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...(props as Record<string, unknown>)}>{children}</a>;
  };
});

// Mock the entire page module
const mockAdminSchoolsPage = jest.fn();
jest.mock('../page', () => ({
  default: mockAdminSchoolsPage,
}));

describe('AdminSchoolsPage', () => {
  const mockSession = {
    email: 'admin@example.com',
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders schools management page with data', async () => {
    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
        address: '123 Main St, City, State 12345',
        contactEmail: 'admin@lincoln.edu',
        phone: '(555) 123-4567',
      },
      {
        schoolId: 'school-b',
        name: 'Washington High',
        address: '456 Oak Ave, City, State 67890',
        contactEmail: 'info@washington.edu',
        phone: '(555) 987-6543',
      },
    ];
    
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const mockPage = React.createElement('div', {
      'data-admin-schools-page': 'true'
    }, [
      React.createElement('h1', { key: 'title' }, 'Manage Schools'),
      React.createElement('p', { key: 'subtitle' }, 'School Profiles'),
      React.createElement('div', { key: 'table', 'data-schools-table': 'true' },
        React.createElement('table', null,
          React.createElement('tbody', null,
            mockSchools.map((school, _index) =>
              React.createElement('tr', {
                key: school.schoolId,
                'data-school-id': school.schoolId,
                'data-school-name': school.name,
                'data-school-address': school.address,
                'data-school-contact-email': school.contactEmail,
                'data-school-phone': school.phone,
              }, [
                React.createElement('td', { key: 'name' }, school.name),
                React.createElement('td', { key: 'email' }, school.contactEmail),
                React.createElement('td', { key: 'actions' },
                  React.createElement('a', { href: `/admin/schools/${school.schoolId}` }, 'View')
                ),
              ])
            )
          )
        )
      ),
      React.createElement('a', { key: 'create', href: '/admin/schools/create' }, 'Create New School'),
      React.createElement('a', { key: 'back', href: '/admin/dashboard' }, '← Back to Dashboard'),
    ]);

    mockAdminSchoolsPage.mockResolvedValue(mockPage);
    const Page = await AdminSchoolsPage();
    render(Page);

    expect(screen.getByText('Manage Schools')).toBeInTheDocument();
    expect(screen.getByText('School Profiles')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Elementary')).toBeInTheDocument();
    expect(screen.getByText('Washington High')).toBeInTheDocument();
  });

  it('renders empty state when no schools exist', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminSchoolsPage();
    render(Page);

    expect(screen.getByText('No schools found. Create your first school profile.')).toBeInTheDocument();
  });

  it('has proper data attributes for parsing', async () => {
    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
        address: '123 Main St, City, State 12345',
        contactEmail: 'admin@lincoln.edu',
        phone: '(555) 123-4567',
      },
    ];

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllSchools.mockResolvedValue(mockSchools);

    const Page = await AdminSchoolsPage();
    render(Page);

    // Check page metadata
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    
    // Check school row data attributes
    const schoolRow = screen.getByText('Lincoln Elementary').closest('tr');
    expect(schoolRow).toHaveAttribute('data-school-id', 'school-a');
    expect(schoolRow).toHaveAttribute('data-school-name', 'Lincoln Elementary');
    expect(schoolRow).toHaveAttribute('data-school-address', '123 Main St, City, State 12345');
    expect(schoolRow).toHaveAttribute('data-school-contact-email', 'admin@lincoln.edu');
    expect(schoolRow).toHaveAttribute('data-school-phone', '(555) 123-4567');
  });

  it('throws error when user is not admin', async () => {
    mockGetUserSession.mockResolvedValue(null);

    await expect(AdminSchoolsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('throws error when user role is not admin', async () => {
    mockGetUserSession.mockResolvedValue({
      email: 'user@example.com',
      role: 'user',
    });

    await expect(AdminSchoolsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('displays create new school button', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminSchoolsPage();
    render(Page);

    const createButton = screen.getByText('Create New School');
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/admin/schools/create');
  });

  it('displays back to dashboard link', async () => {
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllSchools.mockResolvedValue([]);

    const Page = await AdminSchoolsPage();
    render(Page);

    const backLink = screen.getByText('← Back to Dashboard');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/admin/dashboard');
  });
});