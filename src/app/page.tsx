/**
 * Home Page - MySchool Application
 * 
 * This is the landing page that provides information about the testbed
 * and links to login for different user types.
 */

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold">
          Welcome to MySchool
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A testbed application for testing MySchools App integration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">For Parents</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Log in to view your child's school information, notices, and updates.
            </p>
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Parent Login
            </a>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">For Administrators</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage schools, users, groups, and notices for testing purposes.
            </p>
            <a 
              href="/admin/login" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Admin Login
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-4">About This Testbed</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            MySchool is a simulated school portal designed specifically for testing
            the MySchools App. It provides a realistic environment for validating
            data aggregation, HTML parsing, and user interactions.
          </p>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500">
        <p>MySchool Testbed v1.0.0 | Powered by Next.js and Firebase</p>
      </footer>
    </div>
  )
}
