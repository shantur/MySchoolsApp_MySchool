/**
 * Verify Token API Route
 * 
 * Handles ID token verification using Firebase Admin SDK
 * POST /api/auth/verify-token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-lazy';
import { createSession } from '@/lib/auth/session';
import { SESSION_CONFIG } from '@/lib/auth/session';
import { UserSession } from '@/lib/types';

/**
 * POST /api/auth/verify-token
 * 
 * Verifies a Firebase ID token and creates a session cookie
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const { idToken } = body;

    // Validate input
    if (!idToken) {
      return NextResponse.json(
        {
          error: 'ID token is required',
          code: 'missing_token',
        },
        { status: 400 }
      );
    }

    // Get Firebase Admin SDK
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      console.error('Firebase Admin SDK not initialized');
      return NextResponse.json(
        {
          error: 'Authentication service unavailable',
          code: 'service_unavailable',
        },
        { status: 500 }
      );
    }

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        {
          error: 'Invalid authentication token',
          code: 'invalid_token',
        },
        { status: 401 }
      );
    }

    // Get user UID from decoded token
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        {
          error: 'Invalid token: missing email',
          code: 'invalid_token',
        },
        { status: 401 }
      );
    }

    // Fetch user document from Firestore to get additional user data
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          error: 'User account not found',
          code: 'user_not_found',
        },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as UserSession;

    // Create user session object
    const userSession: UserSession = {
      uid: userData.uid,
      email: userData.email,
      schoolId: userData.schoolId,
      role: userData.role,
      displayName: userData.displayName,
      groupIds: userData.groupIds,
    };

    // Create session token
    const sessionToken = createSession(userSession);

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        user: userSession,
      },
      { status: 200 }
    );

    // Set session cookie
    const cookieValue = [
      `${SESSION_CONFIG.cookieName}=${sessionToken}`,
      `Max-Age=${SESSION_CONFIG.maxAge / 1000}`,
      `Path=${SESSION_CONFIG.path}`,
      `SameSite=${SESSION_CONFIG.sameSite}`,
      'HttpOnly',
      SESSION_CONFIG.secure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    response.headers.set('Set-Cookie', cookieValue);

    return response;
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'internal_error',
      },
      { status: 500 }
    );
  }
}