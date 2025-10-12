/**
 * Progress Component
 * 
 * Progress indicator component following Material Design 3 guidelines.
 * TODO: Implement full Progress component with all features
 */

import React from 'react';

export interface ProgressProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value = 0, max = 100, indeterminate = false, className }) => {
  return (
    <div className={`w-full h-2 bg-surface-variant rounded-full overflow-hidden ${className || ''}`}>
      <div
        className={`h-full bg-primary transition-all duration-300 ${indeterminate ? 'animate-pulse' : ''}`}
        style={{ width: indeterminate ? '100%' : `${(value / max) * 100}%` }}
      />
    </div>
  );
};

export default Progress;