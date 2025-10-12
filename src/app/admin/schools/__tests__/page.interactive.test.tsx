/**
 * Test for Manage Schools Page Interactive Elements
 * Tests that interactive elements work correctly without React errors
 */

import { render, act } from '@testing-library/react';
import AdminSchoolsPage from '../page';
import { getUserSession } from '@/lib/auth/session';
import { getAllSchools } from '@/lib/handlers/schools-handler';

// Mock the dependencies
jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/schools-handler');

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockGetAllSchools = getAllSchools as jest.MockedFunction<typeof getAllSchools>;

describe('AdminSchoolsPage Interactive Elements', () => {
  const mockSession = {
    email: 'admin@test.com',
    role: 'admin' as const,
    schoolId: 'test-school-123',
  };

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
    mockGetAllSchools.mockResolvedValue(mockSchools);
  });

  it('should render delete buttons without React errors', async () => {
    // After fixing the issue, this should pass without errors
    // The delete button is now properly handled as a client component
    
    const page = await AdminSchoolsPage();
    expect(() => {
      render(page);
    }).not.toThrow();
  });

  it('should have proper data attributes for delete buttons', async () => {
    // After fixing the issue, this test should pass
    // The delete button should be properly handled as a client component
    
    const page = await AdminSchoolsPage();
    const { container } = render(page);
    
    const deleteButton = container.querySelector('[data-school-action="delete"]');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute('type', 'button');
  });

  it('should handle delete action when button is clicked', async () => {
    // This test will verify the delete functionality works after fixing the component
    // Initially this will fail due to the Server Component issue
    
    const page = await AdminSchoolsPage();
    const { container } = render(page);
    
    const deleteButton = container.querySelector('[data-school-action="delete"]') as HTMLButtonElement;
    
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
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete Test School?');
      }
    } finally {
      window.confirm = originalConfirm;
    }
  });
});