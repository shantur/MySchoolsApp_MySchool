/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

/**
 * Utility function to conditionally join class names together.
 * This is a lightweight alternative to the `clsx` or `classnames` libraries.
 * 
 * @param inputs - Class names to be joined
 * @returns Combined class name string
 * 
 * @example
 * ```tsx
 * cn('btn', isActive && 'btn-active', 'btn-primary')
 * // Returns: 'btn btn-active btn-primary' (if isActive is true)
 * // Returns: 'btn btn-primary' (if isActive is false)
 * ```
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Convert a date value (string or Date object) to ISO string format.
 * Handles the migration period where some dates are strings, others are Date objects.
 * 
 * @param date - Date value (string or Date object)
 * @returns ISO date string
 */
export function toISODate(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Format a date string to a human-readable format.
 * 
 * @param dateString - ISO date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date value to a time string.
 * 
 * @param date - Date value (string or Date object)
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', options);
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * 
 * @param func - The function to debounce
 * @param wait - The delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a unique ID for form elements or other DOM elements.
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object).
 * 
 * @param value - Value to check
 * @returns True if the value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Clamp a number between a minimum and maximum value.
 * 
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}