-- Schema Verification Queries for Phase 2 Migration

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================
SELECT 
  'TABLES' as category,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY table_name;

-- =====================================================
-- 2. CHECK RLS IS ENABLED
-- =====================================================
SELECT 
  'RLS' as category,
  tablename as table_name,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY tablename;

-- =====================================================
-- 3. CHECK INDEXES
-- =====================================================
SELECT 
  'INDEXES' as category,
  tablename as table_name,
  indexname as index_name
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY tablename, indexname;

-- =====================================================
-- 4. CHECK FOREIGN KEYS
-- =====================================================
SELECT
  'FOREIGN_KEYS' as category,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 5. CHECK CONSTRAINTS
-- =====================================================
SELECT
  'CONSTRAINTS' as category,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
  AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 6. CHECK TRIGGERS
-- =====================================================
SELECT
  'TRIGGERS' as category,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 7. CHECK RLS POLICIES
-- =====================================================
SELECT
  'RLS_POLICIES' as category,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = '*' THEN 'ALL'
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY tablename, policyname;

-- =====================================================
-- 8. CHECK HELPER FUNCTIONS
-- =====================================================
SELECT
  'FUNCTIONS' as category,
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_authenticated', 'is_admin', 'get_user_school_id', 'user_belongs_to_group', 'update_updated_at_column')
ORDER BY routine_name;

-- =====================================================
-- 9. TABLE COLUMN DETAILS
-- =====================================================
SELECT
  'COLUMNS' as category,
  table_name,
  column_name,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs')
ORDER BY table_name, ordinal_position;
