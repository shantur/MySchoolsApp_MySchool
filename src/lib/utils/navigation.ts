/**
 * Navigation utilities
 * 
 * Wraps window.location methods to make them easily mockable in tests
 */

export const navigation = {
  /**
   * Navigate to a new URL using full page navigation
   * @param url - The URL to navigate to
   */
  assign(url: string): void {
    window.location.assign(url);
  },

  /**
   * Reload the current page
   */
  reload(): void {
    window.location.reload();
  },

  /**
   * Replace the current page in history with a new URL
   * @param url - The URL to replace with
   */
  replace(url: string): void {
    window.location.replace(url);
  },
};
