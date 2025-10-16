-- Phase 5: Storage Migration - Storage RLS Policies
-- This migration creates Row Level Security policies for storage buckets

-- ============================================================================
-- ATTACHMENTS BUCKET POLICIES (Private)
-- ============================================================================

-- Policy: Users can read attachments for their schools/groups
CREATE POLICY "Users can read attachments for their schools"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND (
    -- Admins can read all attachments
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    -- Users can read attachments for schools they belong to
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.school_id::text = split_part(storage.objects.name, '/', 2)
    )
  )
);

-- Policy: Admins can upload attachments
CREATE POLICY "Admins can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can update attachments
CREATE POLICY "Admins can update attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete attachments
CREATE POLICY "Admins can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- SCHOOL-LOGOS BUCKET POLICIES (Public)
-- ============================================================================

-- Policy: Anyone can read school logos (public bucket)
CREATE POLICY "Anyone can read school logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

-- Policy: Admins can upload school logos
CREATE POLICY "Admins can upload school logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can update school logos
CREATE POLICY "Admins can update school logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-logos'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete school logos
CREATE POLICY "Admins can delete school logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-logos'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%attachments%' OR policyname LIKE '%school logos%';
  
  IF policy_count < 8 THEN
    RAISE WARNING 'Expected 8 storage policies, found %', policy_count;
  ELSE
    RAISE NOTICE 'Storage RLS policies created successfully: % policies', policy_count;
  END IF;
END $$;
