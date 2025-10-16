-- Phase 5: Storage Migration - Create Storage Buckets
-- This migration creates storage buckets for attachments and school logos

-- Create attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false, -- Private bucket - authenticated users only
  52428800, -- 50 MiB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create school-logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos',
  'school-logos',
  true, -- Public bucket - read-only for all
  5242880, -- 5 MiB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Verify buckets were created
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id IN ('attachments', 'school-logos');
  IF bucket_count <> 2 THEN
    RAISE EXCEPTION 'Failed to create storage buckets. Expected 2, got %', bucket_count;
  END IF;
  RAISE NOTICE 'Storage buckets created successfully: attachments (private), school-logos (public)';
END $$;
