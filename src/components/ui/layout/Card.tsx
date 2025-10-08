/**
 * Card Component
 * 
 * A versatile card component that follows Material Design 3 guidelines.
 * Cards are used to group related content and actions together.
 * 
 * @example
 * ```tsx
 * <Card elevation={2}>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description goes here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardActions>
 *     <Button variant="text">Action 1</Button>
 *     <Button variant="text">Action 2</Button>
 *   </CardActions>
 * </Card>
 * ```
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The elevation level of the card (0-5).
   * Higher values create more prominent shadows.
   * @default 1
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  
  /**
   * Whether the card is interactive (clickable).
   * Adds hover effects and cursor pointer.
   * @default false
   */
  interactive?: boolean;
  
  /**
   * Whether the card should take the full width of its container.
   * @default false
   */
  fullWidth?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      elevation = 1,
      interactive = false,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      // Base styles
      'surface',
      'rounded-medium',
      'transition-all',
      'duration-200',
      
      // Elevation
      `shadow-elevation-${elevation}`,
      
      // Interactive states
      interactive && [
        'cursor-pointer',
        'hover:shadow-elevation-2',
        'active:shadow-elevation-1',
        'active:scale-[0.98]',
      ],
      
      // Width
      fullWidth ? 'w-full' : 'w-auto',
      
      // Custom classes
      className
    );

    return (
      <div
        ref={ref}
        className={cardClasses}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.currentTarget.click();
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better structure

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to add padding to the header.
   * @default true
   */
  padded?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padded = true, children, ...props }, ref) => {
    const headerClasses = cn(
      padded && 'px-6 pt-6 pb-4',
      className
    );

    return (
      <div
        ref={ref}
        className={headerClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level for the title.
   * @default 3
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 3, children, ...props }, ref) => {
    const TitleTag = `h${level}` as const;
    const titleClasses = cn(
      'title-large',
      'text-on-surface',
      'font-medium',
      'mb-1',
      className
    );

    return (
      <TitleTag
        ref={ref}
        className={titleClasses}
        {...props}
      >
        {children}
      </TitleTag>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional props for the card description */
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const descriptionClasses = cn(
      'body-medium',
      'text-on-surface-variant',
      className
    );

    return (
      <p
        ref={ref}
        className={descriptionClasses}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to add padding to the content.
   * @default true
   */
  padded?: boolean;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padded = true, children, ...props }, ref) => {
    const contentClasses = cn(
      padded && 'px-6 pb-6',
      !padded && 'px-6',
      className
    );

    return (
      <div
        ref={ref}
        className={contentClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to align actions to the right.
   * @default false
   */
  alignRight?: boolean;
  
  /**
   * The spacing between actions.
   * @default 'medium'
   */
  spacing?: 'small' | 'medium' | 'large';
}

export const CardActions = forwardRef<HTMLDivElement, CardActionsProps>(
  ({ 
    className, 
    alignRight = false, 
    spacing = 'medium',
    children, 
    ...props 
  }, ref) => {
    const spacingClasses = {
      small: 'gap-2',
      medium: 'gap-4',
      large: 'gap-6',
    };

    const actionsClasses = cn(
      'flex',
      'items-center',
      spacingClasses[spacing],
      alignRight ? 'justify-end' : 'justify-start',
      'px-6',
      'pb-6',
      className
    );

    return (
      <div
        ref={ref}
        className={actionsClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardActions.displayName = 'CardActions';

export default Card;