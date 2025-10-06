# MySchool - School Portal Testbed

MySchool is a Next.js-based web application that serves as a dedicated testbed for the MySchools App. It simulates a realistic school portal environment, allowing comprehensive testing and validation of data aggregation, HTML parsing, and user interactions.

## Overview

This application is built with:
- **Next.js 14+** with App Router for server-side rendering
- **TypeScript** for type safety
- **Firebase** (Firestore, Auth, Storage) as the backend
- **Tailwind CSS** for styling
- **Jest** and React Testing Library for testing

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the `myschools-app-dev` Firebase project

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase credentials:**
   
   **Option A: Automated Setup (Recommended)**
   ```bash
   # Login to Firebase (interactive)
   firebase login
   
   # Run the setup script
   ./setup-firebase-credentials.sh
   ```
   
   **Option B: Manual Setup**
   - Copy `.env.local.example` to `.env.local`
   - Fill in the Firebase configuration values from the Firebase Console
   - Download the service account key from Firebase Console and save as `firebase-admin-key.json`

3. **Verify configuration:**
   Ensure the following files exist and are configured:
   - `.env.local` (contains Firebase client SDK config)
   - `firebase-admin-key.json` (contains Firebase Admin SDK credentials)
   - `.firebaserc` (points to `myschools-app-dev` project)

### Development

1. **Start Firebase Emulators** (in one terminal):
   ```bash
   npm run emulators
   ```
   
   This starts:
   - Auth Emulator on port 9099
   - Firestore Emulator on port 8080
   - Storage Emulator on port 9199
   - Emulator UI on port 4000

2. **Start the Next.js development server** (in another terminal):
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

### Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
myschool/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── lib/
│   │   ├── firebase/         # Firebase SDK configurations
│   │   │   ├── client.ts     # Firebase Client SDK
│   │   │   ├── admin.ts      # Firebase Admin SDK
│   │   │   └── __tests__/    # Firebase tests
│   │   └── types/            # Shared TypeScript types
│   │       └── index.ts      # Type definitions
│   └── components/           # Reusable React components
│       └── __tests__/        # Component tests
├── firebase.json             # Firebase configuration
├── .firebaserc               # Firebase project alias
├── .env.local                # Environment variables (git-ignored)
├── firebase-admin-key.json   # Service account key (git-ignored)
└── package.json              # Dependencies and scripts
```

## Environment Variables

### Client SDK (Public - prefixed with NEXT_PUBLIC_)
These are exposed to the browser:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` (default: true in development)

### Admin SDK (Private - server-side only)
Choose one of the following:
- `FIREBASE_ADMIN_KEY_PATH` - Path to service account JSON file (Development)
- `FIREBASE_ADMIN_KEY_BASE64` - Base64-encoded service account (Production/CI/CD)

### Other Configuration
- `NODE_ENV` - Environment (development/production)
- `USE_FIREBASE_EMULATORS` - Whether to use emulators (default: true in development)

## Firebase Emulators

The project is configured to use Firebase Emulators for local development:

- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Storage Emulator**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

### Exporting and Importing Emulator Data

```bash
# Export current emulator data
npm run emulators:export

# Start emulators with previously exported data
npm run emulators:import
```

## Key Features (Planned)

### Authentication
- Admin login for managing content
- User login for viewing school-specific information
- Session-based authentication with HTTP-only cookies

### Multi-School Support
- Manage multiple simulated schools
- School-specific data isolation
- User assignment to specific schools

### User Management
- Admin can create user accounts
- Users linked to specific schools and groups

### Notices & Attachments
- Create and publish notices
- Attach files (PDFs, images) to notices
- Secure attachment download endpoints

### HTML as API Contract
- Server-rendered HTML with `data-*` attributes
- Structured for reliable parsing by MySchools App adapter
- Semantic HTML5 for accessibility and parsability

## Testing Strategy

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Use Firebase Emulators to test Firebase interactions
- **Component Tests**: Test React components with React Testing Library
- **E2E Tests**: Validate complete user flows and HTML structure (planned)

## Documentation

For detailed specifications, refer to:
- [MySchool Component Specification](../docs/spec/10_myschool_component.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Quick Start Guide](./QUICK_START.md)

## Development Guidelines

1. **Test-Driven Development (TDD)**: Write tests before implementing features
2. **Type Safety**: Use TypeScript for all code
3. **Security**: Never commit sensitive credentials
4. **Code Quality**: Follow ESLint rules and maintain consistent formatting
5. **Documentation**: Document all public functions and complex logic

## Troubleshooting

### Firebase Authentication Issues
If you encounter authentication errors:
1. Ensure you're logged in: `firebase login`
2. Verify project access: `firebase projects:list`
3. Check `.firebaserc` points to the correct project

### Emulator Connection Issues
If the app can't connect to emulators:
1. Ensure emulators are running: `npm run emulators`
2. Check emulator ports are not in use
3. Verify emulator configuration in `firebase.json`

### Environment Variable Issues
If you see "Firebase configuration is incomplete" errors:
1. Check `.env.local` exists and contains all required variables
2. Restart the Next.js dev server after updating `.env.local`
3. Ensure variable names are prefixed correctly (NEXT_PUBLIC_ for client-side)

## Contributing

This is a testbed application for the MySchools App project. Follow the project-wide guidelines defined in `AGENTS.md` at the repository root.

## License

MIT License - See LICENSE file for details
