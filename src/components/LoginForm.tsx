'use client';

/**
 * Login Form Component
 * 
 * Client-side form component for handling login submissions.
 * Uses data-* attributes for Flutter adapter parsing.
 */

import { useState, FormEvent } from 'react';

interface LoginFormProps {
  redirectUrl?: string;
}

export default function LoginForm({ redirectUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Ensure cookies are included in requests
        body: JSON.stringify({ email, password }),
      });

      console.log('[LoginForm] Response received, status:', response.status);
      const data = await response.json();
      console.log('[LoginForm] Response data:', data);

      if (!response.ok) {
        console.log('[LoginForm] Login failed, showing error');
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Login successful
      console.log('[LoginForm] Login successful, preparing redirect');

      // Determine redirect URL
      let redirectTo: string;
      if (redirectUrl) {
        console.log('[LoginForm] Redirecting to redirectUrl:', redirectUrl);
        redirectTo = redirectUrl;
      } else if (data.user.role === 'admin') {
        // Use /admin/groups instead of /admin/dashboard for testing
        // Dashboard uses Firebase handlers which aren't available during Supabase migration
        console.log('[LoginForm] Redirecting admin to /admin/groups');
        redirectTo = '/admin/groups';
      } else {
        redirectTo = `/${data.user.schoolId}/notices`;
        console.log('[LoginForm] Redirecting user to:', redirectTo);
      }
      
      // Use window.location.assign() for full page navigation with cookie
      // This ensures the Set-Cookie header is processed before the next request
      console.log('[LoginForm] Performing full page navigation to:', redirectTo);
      window.location.assign(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <form 
        onSubmit={handleSubmit}
        data-form-type="login"
        aria-label="Login form"
        className="space-y-6"
      >
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-field="email"
            aria-label="Email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-field="password"
            aria-label="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        <div 
          data-error-container
          className="min-h-[24px]"
        >
          {error && (
            <div 
              data-error-message
              className="text-red-600 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          data-action="login-submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
