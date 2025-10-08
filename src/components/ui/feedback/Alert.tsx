/**
 * Alert Component
 * 
 * Alert message component following Material Design 3 guidelines.
 * Enhanced with comprehensive ARIA support for accessibility.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  /**
   * The variant of the alert, determining its visual style and ARIA role.
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  
  /**
   * Optional title for the alert.
   */
  title?: string;
  
  /**
   * The content of the alert.
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes for styling.
   */
  className?: string;
  
  /**
   * Whether the alert should be announced immediately to screen readers.
   * Defaults to true for error and warning alerts, false for info and success.
   */
  polite?: boolean;
  
  /**
   * Whether the alert can be dismissed by the user.
   */
  dismissible?: boolean;
  
  /**
   * Callback when the alert is dismissed.
   */
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  title, 
  children, 
  className,
  polite,
  dismissible = false,
  onDismiss 
}) => {
  const variantClasses = {
    info: 'bg-primary-container text-on-primary-container border-primary/20',
    success: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-error-container text-on-error-container border-error/20',
  };

  // Determine ARIA role and live region based on variant
  const getAriaRole = () => {
    switch (variant) {
      case 'error':
        return 'alert';
      case 'warning':
        return 'alert';
      case 'success':
        return 'status';
      default:
        return 'status';
    }
  };

  const getAriaLive = () => {
    if (polite !== undefined) return polite ? 'polite' : 'assertive';
    
    // Default behavior: errors and warnings are assertive, info and success are polite
    return (variant === 'error' || variant === 'warning') ? 'assertive' : 'polite';
  };

  const alertId = `alert-${Math.random().toString(36).substr(2, 9)}`;
  const titleId = title ? `${alertId}-title` : undefined;

  return (
    <div
      className={cn(
        'border rounded-medium p-4 relative',
        variantClasses[variant],
        className
      )}
      role={getAriaRole()}
      aria-live={getAriaLive()}
      aria-labelledby={titleId}
    >
      {/* Dismiss button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-current"
          aria-label="Dismiss alert"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Alert title */}
      {title && (
        <h4 
          id={titleId}
          className="label-medium font-medium mb-1"
        >
          {title}
        </h4>
      )}

      {/* Alert content */}
      <div className="body-small">
        {children}
      </div>
    </div>
  );
};

export default Alert;