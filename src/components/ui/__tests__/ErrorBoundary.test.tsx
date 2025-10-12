/**
 * Test for ErrorBoundary Component
 * Tests that error boundaries catch errors and display fallback UI
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const ChildComponent = () => <div data-testid="child">Hello World</div>;
    
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    // Create a component that throws an error
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    // Should show error boundary UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    // Should not show default error UI
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should call custom error handler when provided', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    const mockErrorHandler = jest.fn();
    
    render(
      <ErrorBoundary onError={mockErrorHandler}>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    expect(mockErrorHandler).toHaveBeenCalled();
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error state when retry button is clicked', () => {
    let shouldThrow = true;
    
    const ConditionalErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="recovered">Recovered</div>;
    };
    
    render(
      <ErrorBoundary>
        <ConditionalErrorComponent />
      </ErrorBoundary>
    );
    
    // Should show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Stop throwing error and retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    
    // Should render children again
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should have proper data attributes for parsing', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    // Check for data attributes using querySelector
    const container = document.querySelector('[data-error-boundary="true"]');
    const icon = document.querySelector('[data-error-icon="true"]');
    const title = document.querySelector('[data-error-title="true"]');
    const message = document.querySelector('[data-error-message="true"]');
    const retryButton = document.querySelector('[data-error-action="retry"]');
    const refreshButton = document.querySelector('[data-error-action="refresh"]');
    
    expect(container).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(message).toBeInTheDocument();
    expect(retryButton).toBeInTheDocument();
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const ThrowErrorComponent = () => {
      throw new Error('Test error with details');
    };
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const ThrowErrorComponent = () => {
      throw new Error('Test error with details');
    };
    
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
    
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });
});