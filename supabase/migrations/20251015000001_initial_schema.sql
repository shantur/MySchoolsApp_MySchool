-- MySchoolWeb Initial Schema Migration
-- Converts Firestore collections to PostgreSQL tables with proper constraints

-- Note: Using gen_random_uuid() which is built into PostgreSQL 13+
-- No extensions needed for UUID generation

-- =====================================================
-- SCHOOLS TABLE
-- =====================================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT schools_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT schools_email_format CHECK (
    contact_email IS NULL OR 
    contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Indexes for schools
CREATE INDEX idx_schools_name ON schools(name);
CREATE INDEX idx_schools_created_at ON schools(created_at DESC);

-- =====================================================
-- USERS TABLE (Auth metadata storage)
-- =====================================================
-- Note: Supabase Auth handles the primary auth.users table
-- This table stores additional user metadata
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  display_name TEXT,
  group_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT users_email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- =====================================================
-- GROUPS TABLE
-- =====================================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT groups_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT groups_unique_name_per_school UNIQUE (school_id, name)
);

-- Indexes for groups
CREATE INDEX idx_groups_school_id ON groups(school_id);
CREATE INDEX idx_groups_school_name ON groups(school_id, name);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- =====================================================
-- NOTICES TABLE
-- =====================================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  publication_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  attachments JSONB DEFAULT '[]'::jsonb,
  sender_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT notices_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT notices_body_not_empty CHECK (LENGTH(TRIM(body)) > 0),
  CONSTRAINT notices_attachments_is_array CHECK (jsonb_typeof(attachments) = 'array')
);

-- Indexes for notices
CREATE INDEX idx_notices_school_id ON notices(school_id);
CREATE INDEX idx_notices_group_id ON notices(group_id);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_publication_date ON notices(publication_date DESC);
CREATE INDEX idx_notices_school_status_pubdate ON notices(school_id, status, publication_date DESC);
CREATE INDEX idx_notices_group_status_pubdate ON notices(group_id, status, publication_date DESC);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);

-- GIN index for JSONB attachments for efficient querying
CREATE INDEX idx_notices_attachments ON notices USING GIN (attachments);

-- =====================================================
-- NOTICE_READS TABLE
-- =====================================================
CREATE TABLE notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT notice_reads_unique_user_notice UNIQUE (user_id, notice_id)
);

-- Indexes for notice_reads
CREATE INDEX idx_notice_reads_user_id ON notice_reads(user_id);
CREATE INDEX idx_notice_reads_notice_id ON notice_reads(notice_id);
CREATE INDEX idx_notice_reads_user_school ON notice_reads(user_id, school_id);
CREATE INDEX idx_notice_reads_read_at ON notice_reads(read_at DESC);

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('school', 'user', 'group', 'notice')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT audit_logs_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN (changes);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- =====================================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT
-- =====================================================
CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE schools IS 'Schools managed by the MySchoolWeb platform';
COMMENT ON TABLE users IS 'User accounts with school associations and roles';
COMMENT ON TABLE groups IS 'Groups/classes within schools';
COMMENT ON TABLE notices IS 'Notices/announcements posted to groups';
COMMENT ON TABLE notice_reads IS 'Read tracking for notices by users';
COMMENT ON TABLE audit_logs IS 'Audit trail for all administrative actions';

COMMENT ON COLUMN notices.attachments IS 'JSONB array of attachment metadata: [{id, fileName, fileType, downloadURL, size}]';
COMMENT ON COLUMN users.group_ids IS 'Array of group UUIDs the user belongs to';
COMMENT ON COLUMN audit_logs.changes IS 'JSONB object containing before/after data for updates or full data for create/delete';
