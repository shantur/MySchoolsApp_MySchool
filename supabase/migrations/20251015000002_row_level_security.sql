-- Row Level Security (RLS) Policies for MySchoolWeb
-- Equivalent to Firebase Firestore security rules

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT school_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to a group
CREATE OR REPLACE FUNCTION user_belongs_to_group(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND group_uuid = ANY(group_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHOOLS TABLE RLS POLICIES
-- =====================================================

-- Admins can read all schools
CREATE POLICY "Admins can read all schools"
  ON schools FOR SELECT
  USING (is_admin());

-- Admins can insert schools
CREATE POLICY "Admins can insert schools"
  ON schools FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update schools
CREATE POLICY "Admins can update schools"
  ON schools FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete schools
CREATE POLICY "Admins can delete schools"
  ON schools FOR DELETE
  USING (is_admin());

-- Regular users can read their own school
CREATE POLICY "Users can read their own school"
  ON schools FOR SELECT
  USING (
    is_authenticated() 
    AND id = get_user_school_id()
  );

-- =====================================================
-- USERS TABLE RLS POLICIES
-- =====================================================

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (is_admin());

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin());

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  USING (
    is_authenticated() 
    AND id = auth.uid()
  );

-- =====================================================
-- GROUPS TABLE RLS POLICIES
-- =====================================================

-- Admins can read all groups
CREATE POLICY "Admins can read all groups"
  ON groups FOR SELECT
  USING (is_admin());

-- Admins can insert groups
CREATE POLICY "Admins can insert groups"
  ON groups FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update groups
CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete groups
CREATE POLICY "Admins can delete groups"
  ON groups FOR DELETE
  USING (is_admin());

-- Regular users can read groups in their school
CREATE POLICY "Users can read groups in their school"
  ON groups FOR SELECT
  USING (
    is_authenticated() 
    AND school_id = get_user_school_id()
  );

-- =====================================================
-- NOTICES TABLE RLS POLICIES
-- =====================================================

-- Admins can read all notices
CREATE POLICY "Admins can read all notices"
  ON notices FOR SELECT
  USING (is_admin());

-- Admins can insert notices
CREATE POLICY "Admins can insert notices"
  ON notices FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update notices
CREATE POLICY "Admins can update notices"
  ON notices FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete notices
CREATE POLICY "Admins can delete notices"
  ON notices FOR DELETE
  USING (is_admin());

-- Regular users can read notices for their school
CREATE POLICY "Users can read notices for their school"
  ON notices FOR SELECT
  USING (
    is_authenticated() 
    AND school_id = get_user_school_id()
  );

-- =====================================================
-- NOTICE_READS TABLE RLS POLICIES
-- =====================================================

-- Users can read their own read tracking
CREATE POLICY "Users can read their own read tracking"
  ON notice_reads FOR SELECT
  USING (
    is_authenticated() 
    AND user_id = auth.uid()
  );

-- Users can insert their own read tracking
CREATE POLICY "Users can insert their own read tracking"
  ON notice_reads FOR INSERT
  WITH CHECK (
    is_authenticated() 
    AND user_id = auth.uid()
  );

-- Admins can read all read tracking
CREATE POLICY "Admins can read all read tracking"
  ON notice_reads FOR SELECT
  USING (is_admin());

-- Admins can delete read tracking (for notice cleanup)
CREATE POLICY "Admins can delete read tracking"
  ON notice_reads FOR DELETE
  USING (is_admin());

-- =====================================================
-- AUDIT_LOGS TABLE RLS POLICIES
-- =====================================================

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- No direct writes allowed - audit logs are written via service role
-- Service role bypasses RLS, so application code can write audit logs
-- but users cannot

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION is_authenticated() IS 'Check if user is authenticated';
COMMENT ON FUNCTION is_admin() IS 'Check if authenticated user has admin role';
COMMENT ON FUNCTION get_user_school_id() IS 'Get the school_id of the authenticated user';
COMMENT ON FUNCTION user_belongs_to_group(UUID) IS 'Check if user belongs to a specific group';
