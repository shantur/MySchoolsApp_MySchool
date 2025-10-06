/**
 * Login Page - MySchool Application
 * 
 * Server-rendered login page for both Admin and User authentication.
 * HTML structure designed for parsing by Flutter adapter.
 */

import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Login - MySchool',
  description: 'Login to MySchool portal',
};

export default function LoginPage() {
  return (
    <>
      <div 
        data-page-type="login" 
        data-portal-version="1.0.0"
        data-timestamp={new Date().toISOString()}
        className="hidden"
        aria-hidden="true"
      >
        {/* Page metadata for parser */}
      </div>
      <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Login to MySchool
            </h1>
            <p className="mt-2 text-gray-600">
              Enter your credentials to access your school portal
            </p>
          </div>

          <LoginForm />

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Don&apos;t have an account? Contact your school administrator.
          </p>
        </div>
        </div>
      </main>
    </>
  );
}
