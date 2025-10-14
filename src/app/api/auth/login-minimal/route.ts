import { NextRequest, NextResponse } from 'next/server';

console.log('[Minimal Login] Module loaded');

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Minimal Login] POST called');
  
  try {
    const body = await request.json();
    console.log('[Minimal Login] Body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Minimal login test successful',
      body: body
    });
  } catch (error) {
    console.error('[Minimal Login] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
