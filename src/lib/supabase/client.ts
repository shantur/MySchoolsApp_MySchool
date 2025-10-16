/**
 * Supabase Client SDK Configuration
 * 
 * This module initializes the Supabase Client SDK for browser-side interactions.
 * It uses environment variables prefixed with NEXT_PUBLIC_ to configure the SDK.
 * 
 * Replaces Firebase Client SDK (src/lib/firebase/client.ts)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Supabase URL is not configured. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL is set.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Supabase Anon Key is not configured. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.'
  );
}

// Singleton instance
let browserClient: SupabaseClient | null = null;

/**
 * Create or return existing Supabase browser client
 * 
 * @return {SupabaseClient} Supabase client instance
 */
export function createBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return browserClient;
}

// Export singleton instance for direct use
export const supabase = createBrowserClient();
