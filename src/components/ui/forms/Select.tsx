/**
 * Select Component
 * 
 * Dropdown select component following Material Design 3 guidelines.
 * Enhanced with comprehensive ARIA support for accessibility.
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * The label for the select field.
   */
  label?: string;
  
  /**
   * The error message to display.
   * When provided, the select will be styled in an error state.
   */
  error?: string;
  
  /**
   * Helper text to display below the select.
   * This provides additional context or guidance.
   */
  helperText?: string;
  
  /**
   * Whether the select is required.
   * Adds a required indicator to the label.
   */
  required?: boolean;
  
  /**
   * Whether the select should take the full width of its container.
   */
  fullWidth?: boolean;
  
  /**
   * The container class name for custom styling.
   */
  containerClassName?: string;
  
  /**
   * Array of options for the select.
   */
  options?: { value: string; label: string; disabled?: boolean }[];
  
  /**
   * Placeholder option text.
   */
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      options = [],
      label,
      error,
      helperText,
      required = false,
      fullWidth = false,
      disabled,
      id,
      placeholder,
      children,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for the select if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const labelId = label ? `${selectId}-label` : undefined;

    // Base select classes
    const baseSelectClasses = [
      'w-full',
      'rounded-small',
      'border',
      'px-4',
      'py-3',
      'body-large',
      'text-on-surface',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary/20',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'bg-surface',
      'appearance-none',
      'pr-10', // Space for dropdown arrow
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

    // Combine select classes
    const selectClasses = cn(
      ...baseSelectClasses,
      ...stateClasses,
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
            id={labelId}
            htmlFor={selectId}
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

        {/* Select Container */}
        <div className="relative">
          {/* Select Field */}
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              errorId,
              helperId
            )}
            aria-labelledby={labelId}
            aria-required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>

          {/* Dropdown Arrow */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
            aria-hidden="true"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export default Select;