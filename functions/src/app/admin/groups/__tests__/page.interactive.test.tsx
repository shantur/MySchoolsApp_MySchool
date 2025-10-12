/**
 * Test for Manage Groups Page Interactive Elements
 * Tests that interactive elements work correctly without React errors
 */

import { render, screen, act } from '@testing-library/react';
import AdminGroupsPage from '../page';
import { getUserSession } from '@/lib/auth/session';
import { getAllGroups } from '@/lib/handlers/groups-handler';
import { getAllSchools } from '@/lib/handlers/schools-handler';

// Mock the dependencies
jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/groups-handler');
jest.mock('@/lib/handlers/schools-handler');

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockGetAllGroups = getAllGroups as jest.MockedFunction<typeof getAllGroups>;
const mockGetAllSchools = getAllSchools as jest.MockedFunction<typeof getAllSchools>;

describe('AdminGroupsPage Interactive Elements', () => {
  const mockSession = {
    email: 'admin@test.com',
    role: 'admin' as const,
    schoolId: 'test-school-123',
  };

  const mockGroups = [
    {
      groupId: 'group-1',
      name: 'Test Group',
      schoolId: 'school-1',
      description: 'A test group',
    },
  ];

  const mockSchools = [
    {
      schoolId: 'school-1',
      name: 'Test School',
      address: '123 Test St',
      contactEmail: 'test@school.com',
      phone: '555-1234',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserSession.mockResolvedValue(mockSession);
    mockGetAllGroups.mockResolvedValue(mockGroups);
    mockGetAllSchools.mockResolvedValue(mockSchools);
  });

  it('should render delete buttons without React errors', async () => {
    // After fixing the issue, this should pass without errors
    // The delete button is now properly handled as a client component
    
    const page = await AdminGroupsPage();
    expect(() => {
      render(page);
    }).not.toThrow();
  });

  it('should have proper data attributes for delete buttons', async () => {
    // After fixing the issue, this test should pass
    // The delete button should be properly handled as a client component
    
    const page = await AdminGroupsPage();
    const { container } = render(page);
    
    const deleteButton = container.querySelector('[data-group-action="delete"]');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute('type', 'button');
  });

  it('should handle delete action when button is clicked', async () => {
    // This test will verify the delete functionality works after fixing the component
    
    const page = await AdminGroupsPage();
    const { container } = render(page);
    
    const deleteButton = container.querySelector('[data-group-action="delete"]') as HTMLButtonElement;
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    
    try {
      if (deleteButton) {
        // This should work after fixing the component
        act(() => {
          deleteButton.click();
        });
        // Verify the confirm was called
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete Test Group?');
      }
    } finally {
      window.confirm = originalConfirm;
    }
  });
});