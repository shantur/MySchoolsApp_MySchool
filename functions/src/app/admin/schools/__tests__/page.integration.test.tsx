/**
 * Admin Schools Management Page Integration Tests
 * Tests the actual component behavior with proper mocking
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import React from 'react';

// Mock the dependencies at the top level
const mockGetUserSession = jest.fn();
const mockGetAllSchools = jest.fn();

// Mock modules before any imports
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

describe('AdminSchoolsPage Integration', () => {
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

  it('should load and render schools page successfully', async () => {
    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
        address: '123 Main St, City, State 12345',
        contactEmail: 'admin@lincoln.edu',
        phone: '(555) 123-4567',
      },
    ];

    mockGetAllSchools.mockResolvedValue(mockSchools);

    // Dynamic import to ensure mocks are in place
    const { default: AdminSchoolsPage } = await import('../page');
    
    // This should not throw if authentication is working
    const Page = await AdminSchoolsPage();
    expect(Page).toBeDefined();

    // Render the page
    render(Page);

    // Verify key elements are present
    expect(screen.getByText('Manage Schools')).toBeInTheDocument();
    expect(screen.getByText('School Profiles')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Elementary')).toBeInTheDocument();
  });

  it('should show empty state when no schools exist', async () => {
    mockGetAllSchools.mockResolvedValue([]);

    const { default: AdminSchoolsPage } = await import('../page');
    const Page = await AdminSchoolsPage();
    render(Page);

    expect(screen.getByText('No schools found. Create your first school profile.')).toBeInTheDocument();
  });

  it('should have proper navigation links', async () => {
    mockGetAllSchools.mockResolvedValue([]);

    const { default: AdminSchoolsPage } = await import('../page');
    const Page = await AdminSchoolsPage();
    render(Page);

    const createButton = screen.getByText('Create New School');
    expect(createButton.closest('a')).toHaveAttribute('href', '/admin/schools/create');

    const backLink = screen.getByText('← Back to Dashboard');
    expect(backLink.closest('a')).toHaveAttribute('href', '/admin/dashboard');
  });

  it('should include data attributes for school rows', async () => {
    const mockSchools = [
      {
        schoolId: 'school-a',
        name: 'Lincoln Elementary',
        address: '123 Main St, City, State 12345',
        contactEmail: 'admin@lincoln.edu',
        phone: '(555) 123-4567',
      },
    ];

    mockGetAllSchools.mockResolvedValue(mockSchools);

    const { default: AdminSchoolsPage } = await import('../page');
    const Page = await AdminSchoolsPage();
    render(Page);

    const schoolRow = screen.getByText('Lincoln Elementary').closest('tr');
    expect(schoolRow).toHaveAttribute('data-school-id', 'school-a');
    expect(schoolRow).toHaveAttribute('data-school-name', 'Lincoln Elementary');
    expect(schoolRow).toHaveAttribute('data-school-address', '123 Main St, City, State 12345');
    expect(schoolRow).toHaveAttribute('data-school-contact-email', 'admin@lincoln.edu');
    expect(schoolRow).toHaveAttribute('data-school-phone', '(555) 123-4567');
  });
});

describe('AdminSchoolsPage Authentication', () => {
  it('should throw error when user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const { default: AdminSchoolsPage } = await import('../page');
    
    await expect(AdminSchoolsPage()).rejects.toThrow('Access denied: Admin access required');
  });

  it('should throw error when user is not admin', async () => {
    mockGetUserSession.mockResolvedValue({
      email: 'user@example.com',
      role: 'user',
    });

    const { default: AdminSchoolsPage } = await import('../page');
    
    await expect(AdminSchoolsPage()).rejects.toThrow('Access denied: Admin access required');
  });
});