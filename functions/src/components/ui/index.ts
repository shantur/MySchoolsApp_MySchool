/**
 * UI Components Index
 * 
 * Centralized exports for all UI components in the design system.
 * This file provides a convenient way to import components from a single location.
 */

// Button Components
export { default as Button } from './buttons/Button';
export { default as IconButton } from './buttons/IconButton';

// Form Components
export { default as Input } from './forms/Input';
export { default as Textarea } from './forms/Textarea';
export { default as Select } from './forms/Select';
export { default as Checkbox } from './forms/Checkbox';
export { default as Radio } from './forms/Radio';
export { default as Switch } from './forms/Switch';

// Layout Components
export { default as Card } from './layout/Card';
export { default as Container } from './layout/Container';
export { default as Grid } from './layout/Grid';
export { default as Flex } from './layout/Flex';

// Feedback Components
export { default as Dialog } from './feedback/Dialog';
export { default as Snackbar } from './feedback/Snackbar';
export { default as Progress } from './feedback/Progress';
export { default as Alert } from './feedback/Alert';

// Navigation Components
export { default as AppBar } from './navigation/AppBar';
export { default as Tabs } from './navigation/Tabs';
export { default as Breadcrumb } from './navigation/Breadcrumb';

// Re-export types for TypeScript consumers
export type { ButtonProps } from './buttons/Button';
export type { InputProps } from './forms/Input';
export type { CardProps } from './layout/Card';
export type { DialogProps } from './feedback/Dialog';