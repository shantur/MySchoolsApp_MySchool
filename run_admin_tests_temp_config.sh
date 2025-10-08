#!/bin/bash

# Admin UI Components E2E Test Runner (temporary config)
echo "🧪 Starting Admin UI Components E2E Tests with temporary config..."

# Navigate to myschool directory
cd myschool

# Create evidence directory
mkdir -p evidences/task_007_admin_ui_components/attempt_1

# Run the tests with temporary config (no webServer)
echo "📱 Running tests on mobile portrait orientation using existing server..."
./node_modules/.bin/playwright test tests/e2e/admin-ui-components.spec.ts --config=playwright-temp.config.ts --timeout=60000

# Check test results
if [ $? -eq 0 ]; then
  echo "✅ All Admin UI tests passed successfully!"
else
  echo "❌ Some Admin UI tests failed. Check the report for details."
fi

echo "📊 Test report available at: myschool/playwright-report/index.html"