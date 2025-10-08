/**
 * Container Component
 * 
 * A responsive container component that provides consistent
 * max-width and padding across the application.
 * 
 * @example
 * ```tsx
 * <Container>
 *   <p>Content with consistent container styling</p>
 * </Container>
 * 
 * <Container size="sm" centered>
 *   <p>Small centered container</p>
 * </Container>
 * ```
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The maximum width of the container.
   * - 'sm': 640px max-width
   * - 'md': 768px max-width
   * - 'lg': 1024px max-width
   * - 'xl': 1280px max-width
   * - '2xl': 1536px max-width
   * - 'full': No max-width
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  
  /**
   * Whether to center the container horizontally.
   * @default true
   */
  centered?: boolean;
  
  /**
   * The padding to apply horizontally.
   * - 'none': No padding
   * - 'sm': 16px padding
   * - 'md': 24px padding
   * - 'lg': 32px padding
   * - 'xl': 48px padding
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether the container should take the full width.
   * This overrides the size prop.
   * @default false
   */
  fullWidth?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      size = 'lg',
      centered = true,
      padding = 'md',
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    // Size classes (max-width)
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-none',
    };

    // Padding classes
    const paddingClasses = {
      none: '',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
      xl: 'px-12',
    };

    // Combine all classes
    const containerClasses = cn(
      'w-full',
      !fullWidth && sizeClasses[size],
      centered && 'mx-auto',
      paddingClasses[padding],
      className
    );

    return (
      <div
        ref={ref}
        className={containerClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;