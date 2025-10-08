/**
 * Snackbar Component
 * 
 * Toast notification component following Material Design 3 guidelines.
 * TODO: Implement full Snackbar component with all features
 */

import React from 'react';

export interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const Snackbar: React.FC<SnackbarProps> = ({ open, message, action, className }) => {
  if (!open) return null;
  
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 surface rounded-small elevation-2 px-4 py-3 flex items-center gap-3 ${className || ''}`}>
      <span className="body-medium text-on-surface">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-primary label-medium hover:bg-primary/10 px-2 py-1 rounded"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default Snackbar;