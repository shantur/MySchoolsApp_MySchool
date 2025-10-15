/**
 * Supabase Server Tests
 * 
 * Tests for server-side Supabase client initialization
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Supabase Server', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Server client initialization', () => {
    it('should initialize Supabase server client with service role key', async () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      // Import server client
      const { createServerClient } = await import('../server');
      const client = createServerClient();

      expect(client).toBeDefined();
      expect(typeof client.auth.admin.createUser).toBe('function');
      expect(typeof client.from).toBe('function');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      await expect(async () => {
        await import('../server');
      }).rejects.toThrow('Supabase URL is not configured');
    });

    it('should throw error if SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(async () => {
        await import('../server');
      }).rejects.toThrow('Supabase Service Role Key is not configured');
    });

    it('should return singleton instance on multiple calls', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const { createServerClient } = await import('../server');
      const client1 = createServerClient();
      const client2 = createServerClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Admin operations', () => {
    it('should have admin.createUser method available', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const { createServerClient } = await import('../server');
      const client = createServerClient();

      expect(client.auth.admin.createUser).toBeDefined();
      expect(typeof client.auth.admin.createUser).toBe('function');
    });

    it('should have admin.deleteUser method available', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const { createServerClient } = await import('../server');
      const client = createServerClient();

      expect(client.auth.admin.deleteUser).toBeDefined();
      expect(typeof client.auth.admin.deleteUser).toBe('function');
    });
  });
});
