/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Logout Handler Logic Tests
 */

import { handleLogout } from '../logout-handler';

describe('Logout Handler', () => {
  it('should return success', () => {
    const result = handleLogout();

    expect(result.success).toBe(true);
  });
});
