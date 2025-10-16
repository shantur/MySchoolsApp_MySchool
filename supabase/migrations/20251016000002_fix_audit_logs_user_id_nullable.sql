-- Migration: Fix audit_logs user_id to be nullable
-- The original schema has a contradiction: NOT NULL with ON DELETE SET NULL
-- This migration makes user_id nullable so that audit logs can survive user deletion

-- Step 1: Drop the existing constraint
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Step 2: Make user_id nullable (remove NOT NULL constraint)
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE audit_logs 
  ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update comment
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (nullable to preserve audit logs after user deletion)';
