-- Migration: Allow admins to insert audit logs
-- Originally audit logs were intended to be written via service role only
-- But the application architecture uses user-authenticated connections for audit logging
-- This migration adds INSERT policy for admins to support the current implementation

-- Add INSERT policy for admins
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (is_admin());

-- Update comment to reflect the change
COMMENT ON TABLE audit_logs IS 'Audit trail for all administrative actions. Admins can create entries, only admins can read.';
