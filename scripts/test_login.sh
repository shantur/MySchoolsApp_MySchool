#!/bin/bash
cd /Users/shantur/Coding/MySchoolsApp/myschoolweb
npx jest --config=jest.supabase.config.js src/__tests__/integration/auth-flow.integration.supabase.test.ts --testNamePattern="should handle login through handler" 2>&1