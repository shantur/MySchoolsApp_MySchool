/**
 * LoginForm Component Tests
 * 
 * Tests for the login form component including HTML structure validation.
 * 
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginForm from '../LoginForm';
import { navigation } from '@/lib/utils/navigation';

// Access the global fetchMock from jest-fetch-mock
declare const fetchMock: any;

// Mock Next.js router
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

describe('LoginForm', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

  beforeEach(() => {
    mockPush = jest.fn();
    mockRouter = { push: mockPush };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Reset fetch mock (jest-fetch-mock)
    fetchMock.resetMocks();
    
    // Clear navigation mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTML Structure for Parsing', () => {
    it('should render form with correct data attributes', () => {
      const { container } = render(<LoginForm />);
      
      const form = container.querySelector('[data-form-type="login"]');
      expect(form).toBeInTheDocument();
      expect(form?.tagName).toBe('FORM');
    });

    it('should render email input with data-field attribute', () => {
      const { container } = render(<LoginForm />);
      
      const emailInput = container.querySelector('[data-field="email"]');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput?.getAttribute('type')).toBe('email');
      expect(emailInput?.getAttribute('required')).not.toBeNull();
    });

    it('should render password input with data-field attribute', () => {
      const { container } = render(<LoginForm />);
      
      const passwordInput = container.querySelector('[data-field="password"]');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput?.getAttribute('type')).toBe('password');
      expect(passwordInput?.getAttribute('required')).not.toBeNull();
    });

    it('should render submit button with data-action attribute', () => {
      const { container } = render(<LoginForm />);
      
      const submitButton = container.querySelector(
        '[data-action="login-submit"]'
      );
      expect(submitButton).toBeInTheDocument();
      expect(submitButton?.getAttribute('type')).toBe('submit');
    });

    it('should have error container with data attribute', () => {
      const { container } = render(<LoginForm />);
      
      const errorContainer = container.querySelector('[data-error-container]');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on inputs', () => {
      const { container } = render(<LoginForm />);
      
      const emailInput = container.querySelector('[data-field="email"]');
      const passwordInput = container.querySelector('[data-field="password"]');
      
      expect(emailInput?.getAttribute('aria-label')).toBe('Email address');
      expect(passwordInput?.getAttribute('aria-label')).toBe('Password');
    });

    it('should have form aria-label', () => {
      const { container } = render(<LoginForm />);
      
      const form = container.querySelector('form');
      expect(form?.getAttribute('aria-label')).toBe('Login form');
    });

    it('should have accessible labels', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow entering email and password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should disable form inputs while loading', async () => {
      const user = userEvent.setup();
      // Mock a fetch that never resolves to keep the loading state
      fetchMock.mockImplementation(() => new Promise(() => {}));
      
      render(<LoginForm />);
      
      // Fill in required fields first
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const button = screen.getByRole('button');
        
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent('Logging in...');
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login API on submit with correct credentials', async () => {
      const user = userEvent.setup();
      fetchMock.mockResponseOnce(JSON.stringify({
        user: { role: 'user', schoolId: 'school123' },
      }), { status: 200 });
      
      render(<LoginForm />);
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });
    });

    it('should redirect to user portal on successful user login', async () => {
      const user = userEvent.setup();
      fetchMock.mockResponseOnce(JSON.stringify({
        user: { role: 'user', schoolId: 'school123' },
      }), { status: 200 });
      
      render(<LoginForm />);
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'user@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(navigation.assign).toHaveBeenCalledWith('/school123/notices');
      });
    });

    it('should redirect to admin dashboard on successful admin login', async () => {
      const user = userEvent.setup();
      fetchMock.mockResponseOnce(JSON.stringify({
        user: { role: 'admin', schoolId: 'school123' },
      }), { status: 200 });
      
      render(<LoginForm />);
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'admin@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'adminpass');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(navigation.assign).toHaveBeenCalledWith('/admin/groups');
      });
    });

    it('should display error message on failed login', async () => {
      const user = userEvent.setup();
      const { container } = render(<LoginForm />);
      
      fetchMock.mockResponseOnce(JSON.stringify({
        error: 'Invalid credentials',
        code: 'auth/invalid-credentials',
      }), { status: 401 });
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'wrong@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        const errorMessage = container.querySelector('[data-error-message]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Invalid credentials');
      });
    });

    it('should display generic error on network failure', async () => {
      const user = userEvent.setup();
      const { container } = render(<LoginForm />);
      
      fetchMock.mockRejectOnce(new Error('Network error'));
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        const errorMessage = container.querySelector('[data-error-message]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(
          'An error occurred. Please try again.'
        );
      });
    });
  });

  describe('Error Display', () => {
    it('should show error with data-error-message attribute', async () => {
      const user = userEvent.setup();
      const { container } = render(<LoginForm />);
      
      fetchMock.mockResponseOnce(JSON.stringify({
        error: 'Test error',
        code: 'test_error'
      }), { status: 400 });
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'password');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        const errorMessage = container.querySelector('[data-error-message]');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage?.getAttribute('role')).toBe('alert');
      });
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      const { container } = render(<LoginForm />);
      
      // First failed attempt
      fetchMock.mockResponseOnce(JSON.stringify({
        error: 'First error'
      }), { status: 400 });
      
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'wrong');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(container.querySelector('[data-error-message]'))
          .toHaveTextContent('First error');
      });
      
      // Second attempt - error should clear before showing new one
      fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      await user.clear(screen.getByLabelText(/^password$/i));
      await user.type(screen.getByLabelText(/^password$/i), 'newpass');
      await user.click(screen.getByRole('button', { name: /^login$/i }));
      
      // Error should be cleared immediately on submit
      await waitFor(() => {
        const errorMessage = container.querySelector('[data-error-message]');
        expect(errorMessage).not.toBeInTheDocument();
      });
    });
  });
});
