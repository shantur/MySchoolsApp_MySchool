/**
 * Unit tests for GroupActions Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupActions from '../GroupActions';

// Mock the apiClient utility instead of raw fetch
jest.mock('@/lib/utils/api-client', () => ({
  apiDelete: jest.fn(),
}));

// Import the mocked function
import { apiDelete } from '@/lib/utils/api-client';

// Mock window.alert
global.alert = jest.fn();





describe('GroupActions', () => {
  const mockProps = {
    groupId: 'test-group-id',
    groupName: 'Test Group',
  };

  const mockApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render delete button', () => {
      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute('data-group-action', 'delete');
    });

    it('should have proper styling classes', () => {
      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveClass('text-red-600', 'hover:text-red-900');
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete is clicked', () => {
      // Mock confirm to return false (user cancels)
      window.confirm = jest.fn(() => false);

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete Test Group? This action cannot be undone.'
      );
    });

    it('should not call API if user cancels deletion', () => {
      // Mock confirm to return false (user cancels)
      window.confirm = jest.fn(() => false);

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      expect(mockApiDelete).not.toHaveBeenCalled();
    });

    it('should call API when user confirms deletion', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      mockApiDelete.mockResolvedValue({
        success: true,
      });

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockApiDelete).toHaveBeenCalledWith('/api/admin/groups/test-group-id');
      });
    });

    it('should show loading state while deleting', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      // Mock a slow API response
      mockApiDelete.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
          });
        }, 100);
      }));

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      // Should show loading state immediately
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();

      // Wait for the operation to complete
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should complete deletion process successfully', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      mockApiDelete.mockResolvedValue({
        success: true,
      });

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockApiDelete).toHaveBeenCalledWith('/api/admin/groups/test-group-id');
      });
    });

    it('should call onDelete callback if provided', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      const mockOnDelete = jest.fn();

      mockApiDelete.mockResolvedValue({
        success: true,
      });

      render(<GroupActions {...mockProps} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('test-group-id');
      });
    });

    it('should show alert on API error', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      mockApiDelete.mockResolvedValue({
        success: false,
        error: 'Delete failed',
      });

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Delete failed');
      });
    });

    it('should show generic alert on network error', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      mockApiDelete.mockRejectedValue(new Error('Network error'));

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button type', () => {
      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveAttribute('type', 'button');
    });

    it('should be disabled during loading state', async () => {
      // Mock confirm to return true (user confirms)
      window.confirm = jest.fn(() => true);

      // Mock a slow API response
      mockApiDelete.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
          });
        }, 100);
      }));

      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('HTML Structure', () => {
    it('should have proper data attributes for Flutter adapter', () => {
      render(<GroupActions {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveAttribute('data-group-action', 'delete');
    });

    it('should be wrapped in proper container div', () => {
      const { container } = render(<GroupActions {...mockProps} />);

      const flexContainer = container.querySelector('.flex.gap-2');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(screen.getByRole('button', { name: 'Delete' }));
    });
  });
});