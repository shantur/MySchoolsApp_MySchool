/**
 * Test for LoginForm Redirect Logic
 * Tests that admin users are redirected to admin dashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginForm from '../LoginForm';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('LoginForm Redirect Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
    
    // Mock successful login response for admin
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          uid: 'admin-123',
          email: 'admin@test.com',
          schoolId: 'test-school-123',
          role: 'admin',
          displayName: 'Test Admin User',
          groupIds: [],
        },
      }),
    });
  });

  it('should redirect admin users to admin dashboard', async () => {
    render(<LoginForm />);
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'any-password' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should redirect regular users to notices page', async () => {
    // Mock successful login response for regular user
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          uid: 'user-123',
          email: 'user@test.com',
          schoolId: 'test-school-123',
          role: 'user',
          displayName: 'Test Regular User',
          groupIds: [],
        },
      }),
    });
    
    render(<LoginForm />);
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'any-password' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test-school-123/notices');
    });
  });

  it('should redirect to provided redirectUrl if available', async () => {
    const redirectUrl = '/custom/redirect/path';
    
    render(<LoginForm redirectUrl={redirectUrl} />);
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'any-password' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(redirectUrl);
    });
    
    // Verify it was called with redirectUrl, not admin dashboard
    expect(mockPush).not.toHaveBeenCalledWith('/admin/dashboard');
  });
});