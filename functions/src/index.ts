import {onRequest} from 'firebase-functions/v2/https';
import {setGlobalOptions} from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import next from 'next';
import type {Request, Response} from 'express';

// Set global options for all functions
setGlobalOptions({
  region: 'us-central1',
  memory: '2GiB',
  timeoutSeconds: 60,
  maxInstances: 100, // Limit concurrent instances to control costs
});

// Initialize Firebase Admin SDK (once at module load)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Next.js app lazily (on first request, NOT at module load)
// This prevents Firebase CLI from trying to load .next during deployment analysis
let nextApp: ReturnType<typeof next> | null = null;
let handle: ((req: Request, res: Response) => Promise<void>) | null = null;
let preparePromise: Promise<void> | null = null;

/**
 * Lazy initialization of Next.js app.
 * Called on first request to avoid loading .next during Firebase deployment analysis.
 */
async function initializeNextApp(): Promise<void> {
  if (!nextApp) {
    logger.info('Initializing Next.js app (first request)');
    
    // Force production mode for Cloud Functions (development mode requires source files)
    nextApp = next({
      dev: false, // Always use production mode in Cloud Functions
      // Set the directory to the functions folder where .next is located
      dir: __dirname + '/..',
      conf: {
        distDir: '.next', // Points to the .next folder within functions/
      }
    });
    
    handle = nextApp.getRequestHandler();
    preparePromise = nextApp.prepare();
  }
  
  // Wait for Next.js to be ready
  if (preparePromise) {
    await preparePromise;
  }
}

/**
 * Cloud Function to handle Next.js SSR requests.
 * 
 * Configuration (set globally via setGlobalOptions):
 * - Memory: 2GiB (Next.js SSR requires significant memory)
 * - Timeout: 60s (allows for cold starts and complex SSR)
 * - Region: us-central1 (default, can be changed based on user distribution)
 * - Max Instances: 100 (cost control)
 */
export const nextjsFunc = onRequest(async (req: Request, res: Response) => {
  try {
    // Initialize Next.js on first request (lazy loading)
    await initializeNextApp();
    
    // Log request for monitoring (structured logging)
    logger.info('Next.js request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    // Handle the request with Next.js (handle is guaranteed to be non-null after initializeNextApp)
    return handle!(req, res);
  } catch (error) {
    // Log error with structured logging
    logger.error('Next.js request error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
    });

    // Send error response if headers not sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An error occurred processing your request',
      });
    }
  }
});
