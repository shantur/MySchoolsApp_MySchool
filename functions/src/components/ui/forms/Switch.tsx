/**
 * Switch Component
 * 
 * Toggle switch component following Material Design 3 guidelines.
 * TODO: Implement full Switch component with all features
 */

import React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={`sr-only peer ${className || ''}`}
        {...props}
      />
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;