/**
 * Input Component
 * 
 * A flexible input component that follows Material Design 3 guidelines.
 * Supports various input types, states, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   label="Email Address"
 *   placeholder="your.email@example.com"
 *   error={errorMessage}
 *   required
 * />
 * 
 * <Input
 *   type="password"
 *   label="Password"
 *   leftIcon={<LockIcon />}
 *   helperText="Must be at least 8 characters"
 * />
 * ```
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * The label for the input field.
   */
  label?: string;
  
  /**
   * The error message to display.
   * When provided, the input will be styled in an error state.
   */
  error?: string;
  
  /**
   * Helper text to display below the input.
   * This provides additional context or guidance.
   */
  helperText?: string;
  
  /**
   * Whether the input is required.
   * Adds a required indicator to the label.
   */
  required?: boolean;
  
  /**
   * Whether the input is in a loading state.
   * Shows a loading spinner and disables the input.
   */
  loading?: boolean;
  
  /**
   * The left icon to display inside the input.
   */
  leftIcon?: React.ReactNode;
  
  /**
   * The right icon to display inside the input.
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Whether the input should take the full width of its container.
   */
  fullWidth?: boolean;
  
  /**
   * The container class name for custom styling.
   */
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = 'text',
      label,
      error,
      helperText,
      required = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for the input if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    // Base input classes
    const baseInputClasses = [
      'w-full',
      'rounded-small',
      'border',
      'px-4',
      'py-3',
      'body-large',
      'text-on-surface',
      'placeholder:text-on-surface-variant',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary/20',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    // State-specific classes
    const stateClasses = error
      ? [
          'border-error',
          'text-error',
          'focus:border-error',
          'focus:ring-error/20',
        ]
      : [
          'border-outline',
          'focus:border-primary',
        ];

    // Icon padding adjustments
    const iconPaddingClasses = [
      leftIcon ? 'pl-12' : '',
      rightIcon ? 'pr-12' : '',
    ];

    // Combine input classes
    const inputClasses = cn(
      ...baseInputClasses,
      ...stateClasses,
      ...iconPaddingClasses,
      className
    );

    // Container classes
    const containerClasses = cn(
      'relative',
      fullWidth ? 'w-full' : 'w-auto',
      containerClassName
    );

    return (
      <div className={containerClasses}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block',
              'label-medium',
              'text-on-surface',
              'mb-2',
              error && 'text-error',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            disabled={disabled || loading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              errorId,
              helperId
            )}
            {...props}
          />

          {/* Right Icon or Loading Spinner */}
          {(rightIcon || loading) && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin text-on-surface-variant"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            id={errorId}
            className="mt-2 label-small text-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <div
            id={helperId}
            className="mt-2 label-small text-on-surface-variant"
          >
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;