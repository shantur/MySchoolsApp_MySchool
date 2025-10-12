/**
 * Radio Component
 * 
 * Radio button component following Material Design 3 guidelines.
 * TODO: Implement full Radio component with all features
 */

import React from 'react';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="radio"
        className={`border-outline text-primary focus:ring-primary/20 ${className || ''}`}
        {...props}
      />
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;