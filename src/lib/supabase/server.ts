/**
 * Supabase Server Client Configuration
 * 
 * This module initializes the Supabase Client with service role key
 * for server-side operations (equivalent to Firebase Admin SDK).
 * 
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with fallback for build-time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate at runtime (not at module load time to allow builds to succeed)
function validateConfig() {
  if (!supabaseUrl) {
    throw new Error(
      'Supabase URL is not configured. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL is set.'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Supabase Service Role Key is not configured. ' +
      'Please ensure SUPABASE_SERVICE_ROLE_KEY is set for server-side operations.'
    );
  }
}

// Singleton instance
let serverClient: SupabaseClient | null = null;

/**
 * Create or return existing Supabase server client with service role key
 * 
 * This client has admin privileges and bypasses Row Level Security (RLS).
 * Equivalent to Firebase Admin SDK.
 * 
 * @return {SupabaseClient} Supabase server client instance
 */
export function createServerClient(): SupabaseClient {
  // Validate configuration at runtime
  validateConfig();
  
  if (serverClient) {
    return serverClient;
  }

  serverClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

// Export singleton instance for direct use (only initialize if config is available)
export const supabaseServer = supabaseUrl && supabaseServiceRoleKey
  ? createServerClient()
  : null as any as SupabaseClient; // Type assertion for build-time compatibility

/**
 * Reset server client instance (useful for testing)
 */
export function resetServerClient(): void {
  serverClient = null;
}
