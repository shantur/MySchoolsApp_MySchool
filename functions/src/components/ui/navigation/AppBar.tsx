/**
 * AppBar Component
 * 
 * Top app bar component following Material Design 3 guidelines.
 * Enhanced with comprehensive ARIA support for accessibility.
 */

import React from 'react';

export interface AppBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  leftAction?: React.ReactNode;
  rightActions?: React.ReactNode;
  elevation?: number;
}

const AppBar: React.FC<AppBarProps> = ({ 
  title, 
  leftAction, 
  rightActions, 
  elevation = 2, 
  className, 
  children, 
  ...props 
}) => {
  return (
    <header 
      className={`surface elevation-${elevation} sticky top-0 z-40 ${className || ''}`}
      role="banner"
      {...props}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left action area */}
        {leftAction && (
          <div 
            className="flex items-center"
            role="navigation"
            aria-label="Back navigation"
          >
            {leftAction}
          </div>
        )}
        
        {/* Title area */}
        {title && (
          <h1 
            className="title-large text-on-surface"
            role="heading"
            aria-level={1}
          >
            {title}
          </h1>
        )}
        {!title && <div />}
        
        {/* Right actions area */}
        {rightActions && (
          <div 
            className="flex items-center gap-2"
            role="toolbar"
            aria-label="Application actions"
          >
            {rightActions}
          </div>
        )}
      </div>
      
      {/* Additional content area */}
      {children && (
        <div role="complementary" aria-label="Additional navigation">
          {children}
        </div>
      )}
    </header>
  );
};

export default AppBar;