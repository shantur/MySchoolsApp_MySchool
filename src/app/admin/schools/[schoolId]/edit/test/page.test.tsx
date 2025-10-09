
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import EditSchoolPage from '../page';

// Mock Next.js router and params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

const mockSchoolData = {
  schoolId: 'test-school',
  name: 'Test School',
  address: '123 Test St',
  contactEmail: 'test@example.com',
  phone: '123-456-7890',
  website: 'http://test.com',
  description: 'A test school',
};

describe('EditSchoolPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useParams as jest.Mock).mockReturnValue({
      schoolId: 'test-school',
    });
    (fetch as jest.Mock).mockClear();
    mockPush.mockClear();
  });

  // Test Case 1: Renders loading state initially
  it('renders loading state initially', async () => {
    // Mock a pending fetch to keep it in a loading state initially
    const pendingPromise = new Promise(() => {});
    (fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    await act(async () => {
      render(<EditSchoolPage />);
    });
    expect(screen.getByText('Loading school data...')).toBeInTheDocument();
  });

  // Test Case 2: Fetches and pre-populates school data
  it('fetches and pre-populates school data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('School ID *')).toHaveValue(mockSchoolData.schoolId);
      expect(screen.getByLabelText('School Name *')).toHaveValue(mockSchoolData.name);
      expect(screen.getByLabelText('Address *')).toHaveValue(mockSchoolData.address);
      expect(screen.getByLabelText('Contact Email *')).toHaveValue(mockSchoolData.contactEmail);
      expect(screen.getByLabelText('Phone Number')).toHaveValue(mockSchoolData.phone);
      expect(screen.getByLabelText('Website')).toHaveValue(mockSchoolData.website);
      expect(screen.getByLabelText('Description')).toHaveValue(mockSchoolData.description);
    });
  });

  // Test Case 3: Handles input changes
  it('handles input changes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('School Name *')).toHaveValue(mockSchoolData.name);
    });

    const schoolNameInput = screen.getByLabelText('School Name *');
    fireEvent.change(schoolNameInput, { target: { value: 'Updated School Name' } });
    expect(schoolNameInput).toHaveValue('Updated School Name');
  });

  // Test Case 4: Successfully saves changes
  it('successfully saves changes', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchoolData),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'School updated successfully' }),
      });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('School Name *'), { target: { value: 'New Name' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // One for GET, one for PUT
      expect(fetch).toHaveBeenCalledWith('/api/admin/schools/test-school', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('\"name\":\"New Name\"'),
      }));
      expect(screen.getByText(/School "New Name" updated successfully./i)).toBeInTheDocument();
    });
  });

  // Test Case 5: Initiates and confirms school deletion
  it('initiates and confirms school deletion', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchoolData),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'School deleted successfully' }),
      });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('School Name *')).toHaveValue(mockSchoolData.name);
    });

    // Initiate deletion
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete School' }));
    });

    // Confirm dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText(`Delete ${mockSchoolData.name}?`)).toBeInTheDocument();
    });

    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // One for GET, one for DELETE
      expect(fetch).toHaveBeenCalledWith('/api/admin/schools/test-school', expect.objectContaining({
        method: 'DELETE',
      }));
      // Expect the success message to be in the document

      expect(mockPush).toHaveBeenCalledWith('/admin/schools'); // Redirected after deletion
    });
  });

  // Test Case 6: Cancels school deletion
  it('cancels school deletion', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('School Name *')).toHaveValue(mockSchoolData.name);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete School' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1); // Only for GET, not DELETE
  });

  // Test Case 7: Checks for form data attributes for Flutter adapter
  it('has correct form data attributes for Flutter adapter', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(() => {
      // Form type
      expect(screen.getByLabelText('Edit school form')).toHaveAttribute('data-form-type', 'edit-school');

      // Fields
      expect(screen.getByLabelText('School ID *')).toHaveAttribute('data-field', 'school-id');
      expect(screen.getByLabelText('School Name *')).toHaveAttribute('data-field', 'school-name');
      expect(screen.getByLabelText('Address *')).toHaveAttribute('data-field', 'school-address');
      expect(screen.getByLabelText('Contact Email *')).toHaveAttribute('data-field', 'contact-email');
      expect(screen.getByLabelText('Phone Number')).toHaveAttribute('data-field', 'phone');
      expect(screen.getByLabelText('Website')).toHaveAttribute('data-field', 'website');
      expect(screen.getByLabelText('Description')).toHaveAttribute('data-field', 'description');

      // Actions
      expect(screen.getByRole('button', { name: 'Save Changes' })).toHaveAttribute('data-action', 'save-school-submit');
      expect(screen.getByRole('button', { name: 'Delete School' })).toHaveAttribute('data-action', 'delete-school-initiate');
      expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/admin/schools');
    });
  });

  // Test Case 8: Checks data attributes for delete confirmation dialog
  it('has correct data attributes for delete confirmation dialog', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete School' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-action', 'delete-school-cancel');
      expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-action', 'delete-school-confirm');
    });
  });

  // Test Case 9: Checks accessibility attributes
  it('has correct accessibility attributes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSchoolData),
    });

    await act(async () => {
      render(<EditSchoolPage />);
    });

    await waitFor(async () => {
      expect(screen.getByLabelText('Edit school form')).toHaveAttribute('aria-label', 'Edit school form');
      expect(screen.getByLabelText('School ID *')).toHaveAttribute('aria-label', 'School ID');
      expect(screen.getByLabelText('School Name *')).toHaveAttribute('aria-label', 'School name');
      expect(screen.getByLabelText('Address *')).toHaveAttribute('aria-label', 'School address');
      expect(screen.getByLabelText('Contact Email *')).toHaveAttribute('aria-label', 'Contact email');
      expect(screen.getByLabelText('Phone Number')).toHaveAttribute('aria-label', 'Phone number');
      expect(screen.getByLabelText('Website')).toHaveAttribute('aria-label', 'School website');
      expect(screen.getByLabelText('Description')).toHaveAttribute('aria-label', 'School description');
      
      // Trigger delete dialog to check its accessibility attributes
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Delete School' }));
      });

      const dialogHeading = await screen.findByRole('heading', { level: 3, name: `Delete ${mockSchoolData.name}?` });
      expect(dialogHeading).toBeInTheDocument();
    });
  });
});
