/**
 * Dialog Component
 * 
 * Modal dialog component following Material Design 3 guidelines.
 * Enhanced with comprehensive ARIA support for accessibility.
 */

'use client';

import React, { useEffect, useRef } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, title, children, className }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (open && dialogRef.current) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the dialog
      dialogRef.current.focus();
      
      // Trap focus within dialog
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
          return;
        }
        
        if (event.key === 'Tab') {
          const focusableElements = dialogRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (event.shiftKey) {
              if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        
        // Restore focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
    
    return undefined;
  }, [open, onClose]);

  if (!open) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${className || ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      ref={dialogRef}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog content */}
      <div 
        className="relative surface rounded-medium elevation-3 p-6 max-w-md w-full mx-4"
        role="document"
      >
        {title && (
          <h2 
            id="dialog-title"
            className="title-large mb-4"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Dialog;