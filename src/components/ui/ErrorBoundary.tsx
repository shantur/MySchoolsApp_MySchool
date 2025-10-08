/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree,
 * logs error information, and displays a fallback UI.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          data-error-boundary="true"
          className="min-h-screen flex items-center justify-center bg-gray-50"
        >
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div 
                data-error-icon="true"
                className="text-6xl mb-4"
              >
                ⚠️
              </div>
              <h1 
                data-error-title="true"
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Something went wrong
              </h1>
              <p 
                data-error-message="true"
                className="text-gray-600 mb-6"
              >
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details 
                  data-error-details="true"
                  className="mb-6 text-left"
                >
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="space-y-3">
                <button
                  data-error-action="retry"
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  data-error-action="refresh"
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}