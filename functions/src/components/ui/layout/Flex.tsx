/**
 * Flex Component
 * 
 * Flexbox layout component following Material Design 3 guidelines.
 * TODO: Implement full Flex component with all features
 */

import React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  gap?: number | string;
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  children: React.ReactNode;
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';

export default Flex;