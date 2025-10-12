/**
 * Button Component
 * 
 * A versatile button component that follows Material Design 3 guidelines.
 * Supports multiple variants, states, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * <Button variant="outlined" disabled>
 *   Disabled Button
 * </Button>
 * 
 * <Button variant="text" loading>
 *   Loading...
 * </Button>
 * ```
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the button.
   * - 'primary': Filled button with primary color
   * - 'secondary': Filled button with secondary color
   * - 'outlined': Outlined button with primary color
   * - 'text': Text button with no background
   * - 'ghost': Transparent button that shows color on hover
   */
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'ghost';
  
  /**
   * The size of the button.
   * - 'sm': Small button (32px height)
   * - 'md': Medium button (40px height)
   * - 'lg': Large button (48px height)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button is in a loading state.
   * When true, shows a loading spinner and disables the button.
   */
  loading?: boolean;
  
  /**
   * Whether the button should take the full width of its container.
   */
  fullWidth?: boolean;
  
  /**
   * The left icon to display in the button.
   */
  leftIcon?: React.ReactNode;
  
  /**
   * The right icon to display in the button.
   */
  rightIcon?: React.ReactNode;
  
  /**
   * The children of the button.
   */
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes that apply to all variants
    const baseClasses = [
      'btn-base',
      'relative',
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-all',
      'duration-200',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-primary',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
    ];

    // Size-specific classes
    const sizeClasses = {
      sm: ['px-4', 'py-2', 'text-sm', 'rounded-small'],
      md: ['px-6', 'py-3', 'label-medium', 'rounded-medium'],
      lg: ['px-8', 'py-4', 'text-base', 'rounded-medium'],
    };

    // Variant-specific classes
    const variantClasses = {
      primary: [
        'bg-primary',
        'text-on-primary',
        'shadow-elevation-1',
        'hover:bg-primary/90',
        'hover:shadow-elevation-2',
        'active:shadow-elevation-0',
        'active:scale-95',
      ],
      secondary: [
        'bg-secondary',
        'text-on-secondary',
        'shadow-elevation-1',
        'hover:bg-secondary/90',
        'hover:shadow-elevation-2',
        'active:shadow-elevation-0',
        'active:scale-95',
      ],
      outlined: [
        'bg-transparent',
        'text-primary',
        'border-2',
        'border-primary',
        'hover:bg-primary/10',
        'active:bg-primary/20',
        'active:scale-95',
      ],
      text: [
        'bg-transparent',
        'text-primary',
        'hover:bg-primary/10',
        'active:bg-primary/20',
        'active:scale-95',
      ],
      ghost: [
        'bg-transparent',
        'text-on-surface',
        'hover:bg-surface-variant',
        'active:bg-surface-variant/80',
        'active:scale-95',
      ],
    };

    // Width classes
    const widthClasses = fullWidth ? ['w-full'] : [];

    // Combine all classes
    const buttonClasses = cn(
      ...baseClasses,
      ...sizeClasses[size],
      ...variantClasses[variant],
      ...widthClasses,
      className
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-describedby={loading ? 'loading-description' : undefined}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="absolute -ml-1 mr-3 h-4 w-4 animate-spin"
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

        {/* Left icon */}
        {leftIcon && !loading && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Button content */}
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>

        {/* Right icon */}
        {rightIcon && !loading && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* Screen reader text for loading state */}
        {loading && (
          <span id="loading-description" className="sr-only">
            Loading, please wait
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;