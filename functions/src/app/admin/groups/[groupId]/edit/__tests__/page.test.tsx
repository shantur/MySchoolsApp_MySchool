/**
 * Unit tests for Edit Group Page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import EditGroupPage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('EditGroupPage', () => {
  const mockPush = jest.fn();
  const mockParams = { groupId: 'test-group-id' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useParams as jest.Mock).mockReturnValue(mockParams);
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EditGroupPage />);

      expect(screen.getByText('Loading group data...')).toBeInTheDocument();
      expect(screen.getByText('Edit Group')).toBeInTheDocument();
    });

    it('should render error state when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Group not found' }),
      });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByText('Group not found')).toBeInTheDocument();
      });
      expect(screen.getByText('Back to Groups')).toBeInTheDocument();
    });

    it('should render form with group data when fetch succeeds', async () => {
      const mockGroup = {
        groupId: 'test-group-id',
        name: 'Test Group',
        description: 'Test Description',
        schoolId: 'test-school-id',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ group: mockGroup }),
      });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      });

      expect(screen.getByText('test-group-id')).toBeInTheDocument();
      expect(screen.getByText('test-school-id')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    const mockGroup = {
      groupId: 'test-group-id',
      name: 'Test Group',
      description: 'Test Description',
      schoolId: 'test-school-id',
    };

    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ group: mockGroup }),
      });
    });

    it('should update form fields when user types', async () => {
      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Group name');
      const descriptionInput = screen.getByLabelText('Group description');

      fireEvent.change(nameInput, { target: { name: 'name', value: 'Updated Group' } });
      fireEvent.change(descriptionInput, { target: { name: 'description', value: 'Updated Description' } });

      expect(screen.getByDisplayValue('Updated Group')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated Description')).toBeInTheDocument();
    });

    it('should show validation error when name is empty', async () => {
      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Group name');
      const form = screen.getByRole('form', { name: 'Edit group form' });

      // Clear the input
      fireEvent.change(nameInput, { target: { value: '' } });
      
      // Submit the form (using form submit event)
      fireEvent.submit(form);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Group name is required')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should submit form successfully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ group: mockGroup }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, group: mockGroup }),
        });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/groups');
      });
    });

    it('should show error message when submission fails', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ group: mockGroup }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Update failed' }),
        });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockGroup = {
        groupId: 'test-group-id',
        name: 'Test Group',
        description: 'Test Description',
        schoolId: 'test-school-id',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ group: mockGroup }),
      });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Group name')).toBeInTheDocument();
        expect(screen.getByLabelText('Group description')).toBeInTheDocument();
      });

      const form = screen.getByRole('form', { name: 'Edit group form' });
      expect(form).toBeInTheDocument();
    });

    it('should show error messages with proper role', async () => {
      const mockGroup = {
        groupId: 'test-group-id',
        name: 'Test Group',
        description: 'Test Description',
        schoolId: 'test-school-id',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ group: mockGroup }),
      });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Group name')).toBeInTheDocument();
        expect(screen.getByLabelText('Group description')).toBeInTheDocument();
      });

      const form = screen.getByRole('form', { name: 'Edit group form' });
      const nameInput = screen.getByLabelText('Group name');

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.submit(form);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Group name is required');
      });
    });
  });

  describe('HTML Structure', () => {
    it('should have proper data attributes for Flutter adapter', async () => {
      const mockGroup = {
        groupId: 'test-group-id',
        name: 'Test Group',
        description: 'Test Description',
        schoolId: 'test-school-id',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ group: mockGroup }),
      });

      render(<EditGroupPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument();
      });

      const form = screen.getByRole('form', { name: 'Edit group form' });
      expect(form).toHaveAttribute('data-form-type', 'edit-group');

      const nameInput = screen.getByLabelText('Group name');
      expect(nameInput).toHaveAttribute('data-field', 'group-name');

      const descriptionInput = screen.getByLabelText('Group description');
      expect(descriptionInput).toHaveAttribute('data-field', 'description');

      const submitButton = screen.getByRole('button', { name: 'Save Changes' });
      expect(submitButton).toHaveAttribute('data-action', 'edit-group-submit');
    });
  });
});