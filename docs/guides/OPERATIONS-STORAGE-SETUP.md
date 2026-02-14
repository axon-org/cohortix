# Operations File Storage Setup

This guide explains how to set up the `operation-files` Supabase Storage bucket for the Operations Redesign feature.

## Overview

The Operations Redesign feature includes file attachments for operations. Files are stored in Supabase Storage in a bucket called `operation-files`.

## Setup Steps

### 1. Create the Storage Bucket

In the Supabase Dashboard:

1. Navigate to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name:** `operation-files`
   - **Public:** ❌ No (private bucket)
   - **File size limit:** 50 MB (recommended)
   - **Allowed MIME types:** (leave empty for all types)

### 2. Configure Storage Policies

After creating the bucket, set up Row-Level Security (RLS) policies.

#### Policy 1: Allow Users to View Files in Their Organization

```sql
CREATE POLICY "Users can view files in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'operation-files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);
```

#### Policy 2: Allow Users to Upload Files to Their Organization

```sql
CREATE POLICY "Users can upload files to their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'operation-files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);
```

#### Policy 3: Allow Users to Update Files in Their Organization

```sql
CREATE POLICY "Users can update files in their organization"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'operation-files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);
```

#### Policy 4: Allow Users to Delete Files in Their Organization

```sql
CREATE POLICY "Users can delete files in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'operation-files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);
```

### 3. File Path Structure

Files are stored with the following path structure:

```
{organizationId}/{projectId}/{timestamp}-{fileName}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/
  └── 123e4567-e89b-12d3-a456-426614174000/
      ├── 1708012345678-design-mockup.pdf
      ├── 1708012456789-wireframes.zip
      └── 1708012567890-logo.png
```

This structure:
- Isolates files by organization (first-level folder)
- Groups files by project (second-level folder)
- Prevents filename conflicts (timestamp prefix)
- Makes cleanup easy (delete entire project folder)

### 4. Verify Setup

Test the storage bucket with a simple upload:

```bash
curl -X POST http://localhost:3000/api/v1/operation-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "projectId=YOUR_PROJECT_ID"
```

Expected response:
```json
{
  "data": {
    "id": "...",
    "name": "test.pdf",
    "fileType": "pdf",
    "fileSize": 12345,
    "storagePath": "org-id/project-id/timestamp-test.pdf",
    "mimeType": "application/pdf",
    "createdAt": "2026-02-14T12:00:00Z"
  }
}
```

## File Type Detection

The API automatically detects file types based on MIME type:

| MIME Type | File Type |
|-----------|-----------|
| `application/pdf` | `pdf` |
| `application/zip`, `application/x-zip-compressed` | `zip` |
| `image/*` | `image` |
| Figma exports | `figma` |
| All others | `generic` |

## Signed URLs for Download

Files are accessed via signed URLs (valid for 1 hour):

```
GET /api/v1/operation-files/{fileId}
```

Response includes a temporary download URL:

```json
{
  "data": {
    "id": "...",
    "name": "test.pdf",
    "downloadUrl": "https://storage.supabase.co/v1/object/sign/operation-files/..."
  }
}
```

## Storage Limits

Recommended limits:
- **Max file size:** 50 MB (configurable in bucket settings)
- **Total storage per organization:** Monitor in Supabase Dashboard
- **File retention:** No automatic cleanup (manual deletion via API)

## Cleanup Strategy

To delete all files for a project:

1. Delete all file records from `operation_files` table (cascade deletes storage files via API)
2. Or manually delete the entire project folder in Supabase Storage

## Troubleshooting

### Upload fails with "Policy violation"

**Cause:** RLS policies not set up correctly.

**Fix:** Verify all 4 storage policies are created and the user is in `organization_memberships`.

### Download URL returns 404

**Cause:** File deleted from storage but record still in database.

**Fix:** Check storage bucket for orphaned records. Clean up with:

```sql
DELETE FROM operation_files
WHERE id NOT IN (
  SELECT ...
  -- Query to check storage bucket existence
);
```

### Large files timeout

**Cause:** File too large or slow network.

**Fix:** 
- Increase file size limit in bucket settings
- Implement chunked uploads (future enhancement)
- Use direct Supabase Storage upload from client (bypass API)

## Migration Checklist

- [ ] Create `operation-files` bucket in Supabase
- [ ] Set bucket to **private** (not public)
- [ ] Add all 4 RLS policies to `storage.objects`
- [ ] Test file upload via API
- [ ] Test file download via signed URL
- [ ] Test file deletion
- [ ] Verify policies prevent cross-organization access

## Security Notes

- ✅ Files are **private** by default (not publicly accessible)
- ✅ RLS policies enforce organization-level isolation
- ✅ Signed URLs expire after 1 hour
- ✅ File paths include organization ID for isolation
- ⚠️ No virus scanning (consider adding for production)
- ⚠️ No file size validation at storage level (API enforces limits)

## Future Enhancements

1. **Virus scanning** — Integrate ClamAV or similar
2. **Image optimization** — Auto-resize/compress images
3. **CDN integration** — CloudFront for faster downloads
4. **Chunked uploads** — Support files > 50 MB
5. **Version control** — Keep file history (overwrite protection)
