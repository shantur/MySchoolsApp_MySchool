#!/bin/bash
cd /Users/shantur/Coding/MySchoolsApp/myschoolweb
npx jest --config=jest.supabase.config.js src/__tests__/integration/auth-flow.integration.supabase.test.ts --testNamePattern="should handle user creation through handler" 2>&1