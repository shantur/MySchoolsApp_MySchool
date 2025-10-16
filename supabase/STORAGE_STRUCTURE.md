# Supabase Storage Bucket Structure

This document defines the storage bucket structure for the MySchoolWeb application, equivalent to the Firebase Storage structure.

## Buckets

### 1. `attachments` (Private Bucket)

**Purpose**: Store notice attachments (PDFs, images, documents)

**Access Policy**: Private (authenticated users only)

**Structure**:
```
attachments/
├── {schoolId}/
│   ├── {groupId}/
│   │   ├── {noticeId}/
│   │   │   ├── {attachmentId}_{filename}
│   │   │   └── ...
```

**Example**:
```
attachments/
├── school_abc123/
│   ├── group_xyz789/
│   │   ├── notice_001/
│   │   │   ├── att_123_annual_report.pdf
│   │   │   └── att_124_photo.jpg
```

**RLS Policies** (To be implemented in Phase 2):
- Users can only read attachments for schools/groups they belong to
- Admins can read/write all attachments
- Regular users cannot delete attachments

### 2. `school-logos` (Public Bucket)

**Purpose**: Store school logo images

**Access Policy**: Public (read-only for all, write for admins only)

**Structure**:
```
school-logos/
├── {schoolId}_logo.{ext}
└── ...
```

**Example**:
```
school-logos/
├── school_abc123_logo.png
├── school_def456_logo.jpg
└── school_ghi789_logo.svg
```

**RLS Policies** (To be implemented in Phase 2):
- Public read access (anyone can view logos)
- Admin-only write access

## File Naming Convention

- **Attachments**: `{attachmentId}_{originalFilename}`
- **School Logos**: `{schoolId}_logo.{extension}`
- Use lowercase, no spaces, underscores for separation

## File Size Limits

As configured in `config.toml`:
- Maximum file size: 50 MiB per file
- Can be adjusted in `supabase/config.toml` → `[storage]` → `file_size_limit`

## MIME Types

### Allowed for Attachments:
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Archives: `application/zip`, `application/x-rar-compressed`

### Allowed for School Logos:
- `image/jpeg`
- `image/png`
- `image/svg+xml`
- `image/webp`

## Migration from Firebase Storage

When migrating existing files from Firebase Storage (Phase 5):

1. Export files from Firebase Storage buckets
2. Transform file paths to match Supabase structure above
3. Upload to corresponding Supabase buckets
4. Update file references in database
5. Verify signed URL generation works correctly

## Creating Buckets

Buckets will be created programmatically in Phase 2 or manually via Supabase Studio:

```sql
-- Create attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
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
    'application/zip'
  ]
);

-- Create school-logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos',
  'school-logos',
  true,
  5242880, -- 5 MiB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
);
```

## Access via Supabase Studio

1. Open: http://127.0.0.1:54323
2. Navigate to "Storage" in left sidebar
3. Create/manage buckets
4. Upload/download files for testing
5. Configure RLS policies

## Notes

- Storage is backed by Docker volumes in local development
- Files persist between `supabase stop` and `supabase start`
- Use `supabase db reset` to clear all data including storage
- In production, Supabase uses S3-compatible storage
