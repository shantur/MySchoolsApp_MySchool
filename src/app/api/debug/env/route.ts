/**
 * Debug Environment Variables Route
 * 
 * Displays all configured environment variables in Cloudflare Workers
 * 
 * ⚠️ WARNING: This route should be disabled in production!
 * Only use for debugging deployment issues.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all environment variables
    const env = {
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
        : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` 
        : 'NOT_SET',
      
      // Session Configuration
      SESSION_SECRET: process.env.SESSION_SECRET 
        ? `${process.env.SESSION_SECRET.substring(0, 20)}...` 
        : 'NOT_SET',
      
      // Node Environment
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      
      // All environment variable keys (for debugging)
      ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || 
        key.includes('SESSION') || 
        key.includes('NODE') ||
        key.includes('NEXT')
      ),
    };

    // Check if required variables are set
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.SESSION_SECRET) missingVars.push('SESSION_SECRET');

    return NextResponse.json({
      status: 'success',
      environment: env,
      missingVariables: missingVars.length > 0 ? missingVars : 'All required variables are set',
      runtime: typeof EdgeRuntime !== 'undefined' ? 'Edge Runtime' : 'Node.js Runtime',
      timestamp: new Date().toISOString(),
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// Also support POST for testing
export async function POST() {
  return GET();
}
