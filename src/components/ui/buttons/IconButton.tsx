/**
 * IconButton Component
 * 
 * A button component that displays only an icon.
 * Follows Material Design 3 guidelines for icon buttons.
 * 
 * @example
 * ```tsx
 * <IconButton
 *   aria-label="Settings"
 *   onClick={handleSettings}
 * >
 *   <SettingsIcon />
 * </IconButton>
 * 
 * <IconButton
 *   variant="outlined"
 *   size="lg"
 *   disabled
 * >
 *   <DeleteIcon />
 * </IconButton>
 * ```
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the icon button.
   * - 'standard': Standard icon button with surface background
   * - 'outlined': Outlined icon button
   * - 'filled': Filled icon button with primary color
   * - 'tonal': Tonal icon button with secondary container
   */
  variant?: 'standard' | 'outlined' | 'filled' | 'tonal';
  
  /**
   * The size of the icon button.
   * - 'sm': Small button (32px)
   * - 'md': Medium button (40px)
   * - 'lg': Large button (48px)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button is in a loading state.
   */
  loading?: boolean;
  
  /**
   * The tooltip text to display on hover.
   */
  tooltip?: string;
  
  /**
   * The icon to display.
   */
  children: React.ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'standard',
      size = 'md',
      loading = false,
      tooltip,
      children,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'transition-all',
      'duration-200',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-primary',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
      'relative',
    ];

    // Size classes
    const sizeClasses = {
      sm: ['w-8', 'h-8'],
      md: ['w-10', 'h-10'],
      lg: ['w-12', 'h-12'],
    };

    // Variant classes
    const variantClasses = {
      standard: [
        'text-on-surface-variant',
        'hover:bg-surface-variant',
        'active:bg-surface-variant/80',
      ],
      outlined: [
        'border',
        'border-outline',
        'text-on-surface-variant',
        'hover:bg-surface-variant',
        'active:bg-surface-variant/80',
      ],
      filled: [
        'bg-primary',
        'text-on-primary',
        'shadow-elevation-1',
        'hover:bg-primary/90',
        'hover:shadow-elevation-2',
        'active:shadow-elevation-0',
        'active:scale-95',
      ],
      tonal: [
        'bg-secondary-container',
        'text-on-secondary-container',
        'hover:bg-secondary-container/90',
        'active:bg-secondary-container/80',
        'active:scale-95',
      ],
    };

    // Combine all classes
    const buttonClasses = cn(
      ...baseClasses,
      ...sizeClasses[size],
      ...variantClasses[variant],
      className
    );

    // Generate accessible label
    const accessibleLabel = ariaLabel || tooltip;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-label={accessibleLabel}
        aria-disabled={disabled || loading}
        title={tooltip}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="absolute h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}

        {/* Icon */}
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;