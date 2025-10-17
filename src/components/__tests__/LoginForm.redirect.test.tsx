/**
 * Test for LoginForm Redirect Logic
 * Tests that admin users are redirected to admin dashboard
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginForm from '../LoginForm';
import { navigation } from '@/lib/utils/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock navigation utility
jest.mock('@/lib/utils/navigation', () => ({
  navigation: {
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  },
}));

// jest-fetch-mock is enabled globally in jest.setup.js
// We'll use fetchMock from jest-fetch-mock instead of global.fetch
declare const fetchMock: any;

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
    
    // Reset fetch mock
    fetchMock.resetMocks();
    
    // Mock successful login response for admin
    fetchMock.mockResponse(JSON.stringify({
      success: true,
      user: {
        uid: 'admin-123',
        email: 'admin@test.com',
        schoolId: 'test-school-123',
        role: 'admin',
        displayName: 'Test Admin User',
        groupIds: [],
      },
    }), { status: 200 });
  });

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
    
    // Reset fetch mock
    fetchMock.resetMocks();
    
    // Clear window.location.assign mock if it exists and is a jest mock
    if (window.location.assign && typeof (window.location.assign as any).mockClear === 'function') {
      (window.location.assign as jest.Mock).mockClear();
    }
    
    // Mock successful login response for admin
    fetchMock.mockResponse(JSON.stringify({
      success: true,
      user: {
        uid: 'admin-123',
        email: 'admin@test.com',
        schoolId: 'test-school-123',
        role: 'admin',
        displayName: 'Test Admin User',
        groupIds: [],
      },
    }), { status: 200 });
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
      expect(navigation.assign).toHaveBeenCalledWith('/admin/groups');
    });
  });

  it('should redirect regular users to notices page', async () => {
    // Mock successful login response for regular user
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      user: {
        uid: 'user-123',
        email: 'user@test.com',
        schoolId: 'test-school-123',
        role: 'user',
        displayName: 'Test Regular User',
        groupIds: [],
      },
    }), { status: 200 });
    
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
      expect(navigation.assign).toHaveBeenCalledWith('/test-school-123/notices');
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
      expect(navigation.assign).toHaveBeenCalledWith(redirectUrl);
    });
    
    // Verify it was called with redirectUrl, not admin dashboard
    expect(navigation.assign).not.toHaveBeenCalledWith('/admin/groups');
  });
});