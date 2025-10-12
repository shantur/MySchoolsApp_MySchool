/**
 * Checkbox Component
 * 
 * Checkbox component following Material Design 3 guidelines.
 * TODO: Implement full Checkbox component with all features
 */

import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`rounded border-outline text-primary focus:ring-primary/20 ${className || ''}`}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;