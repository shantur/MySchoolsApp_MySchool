/**
 * Supabase Client Tests
 * 
 * Tests for browser-side Supabase client initialization
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Client initialization', () => {
    it('should initialize Supabase client with environment variables', async () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Import client (this triggers initialization)
      const { createBrowserClient } = await import('../client');
      const client = createBrowserClient();

      expect(client).toBeDefined();
      expect(typeof client.auth.signInWithPassword).toBe('function');
      expect(typeof client.from).toBe('function');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      await expect(async () => {
        await import('../client');
      }).rejects.toThrow('Supabase URL is not configured');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await expect(async () => {
        await import('../client');
      }).rejects.toThrow('Supabase Anon Key is not configured');
    });

    it('should return singleton instance on multiple calls', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { createBrowserClient } = await import('../client');
      const client1 = createBrowserClient();
      const client2 = createBrowserClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Client configuration', () => {
    it('should configure auth with cookie persistence', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { createBrowserClient } = await import('../client');
      const client = createBrowserClient();

      // Verify auth configuration exists
      expect(client.auth).toBeDefined();
    });
  });
});
