#!/bin/bash

# Admin UI Components E2E Test Runner (using existing server)
echo "🧪 Starting Admin UI Components E2E Tests with existing server..."

# Navigate to myschool directory
cd myschool

# Create evidence directory
mkdir -p evidences/task_007_admin_ui_components/attempt_1

# Run the tests without starting a new server (reuse existing)
echo "📱 Running tests on mobile portrait orientation using existing server..."
PLAYWRIGHT_WEB_SERVER_URL=http://localhost:3003 ./node_modules/.bin/playwright test tests/e2e/admin-ui-components.spec.ts --timeout=60000

# Check test results
if [ $? -eq 0 ]; then
  echo "✅ All Admin UI tests passed successfully!"
else
  echo "❌ Some Admin UI tests failed. Check the report for details."
fi

echo "📊 Test report available at: myschool/playwright-report/index.html"