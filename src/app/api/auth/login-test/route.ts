import { NextResponse } from 'next/server';

export async function POST() {
  console.log('[Login Test] Simple route called');
  return NextResponse.json({ 
    message: 'Test route works',
    timestamp: new Date().toISOString()
  });
}
