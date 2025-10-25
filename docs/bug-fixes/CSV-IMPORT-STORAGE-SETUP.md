# CSV Import Storage Bucket Setup

**Issue:** CSV import fails with 500 error because the `csv-imports` storage bucket doesn't exist in Supabase.

**Error:** `Failed to upload file` when attempting to import CSV files

**Date:** 2025-10-25

## Root Cause

The CSV upload endpoint (`/api/upload/csv`) tries to upload files to a Supabase Storage bucket named `csv-imports`, but this bucket hasn't been created yet in the Supabase project.

## Solution

Create the `csv-imports` storage bucket in Supabase with the following configuration:

### Steps to Fix (Supabase Dashboard)

1. **Navigate to Storage**
   - Go to your Supabase project dashboard
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - **Name:** `csv-imports`
   - **Public bucket:** NO (keep private)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `text/csv`, `application/vnd.ms-excel`, `text/plain`

3. **Configure Storage Policies**

   Create the following RLS policies for the `csv-imports` bucket:

   #### Policy 1: Allow authenticated users to upload
   ```sql
   CREATE POLICY "Users can upload CSV files to their workspace"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'csv-imports' AND
     (storage.foldername(name))[1] IN (
       SELECT workspace_id::text
       FROM workspace_members
       WHERE user_id = auth.uid()
     )
   );
   ```

   #### Policy 2: Allow users to read their workspace files
   ```sql
   CREATE POLICY "Users can read CSV files from their workspace"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'csv-imports' AND
     (storage.foldername(name))[1] IN (
       SELECT workspace_id::text
       FROM workspace_members
       WHERE user_id = auth.uid()
     )
   );
   ```

   #### Policy 3: Allow users to delete their workspace files
   ```sql
   CREATE POLICY "Users can delete CSV files from their workspace"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'csv-imports' AND
     (storage.foldername(name))[1] IN (
       SELECT workspace_id::text
       FROM workspace_members
       WHERE user_id = auth.uid()
     )
   );
   ```

### Alternative: SQL Migration

You can also create this bucket via SQL migration:

```sql
-- Create the csv-imports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'csv-imports',
  'csv-imports',
  false,
  10485760, -- 10MB in bytes
  ARRAY['text/csv', 'application/vnd.ms-excel', 'text/plain']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies (run after bucket creation)
CREATE POLICY "Users can upload CSV files to their workspace"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' AND
  (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read CSV files from their workspace"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete CSV files from their workspace"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

## File Organization

Files are organized by workspace:
```
csv-imports/
├── {workspace-id-1}/
│   ├── {file-id-1}.csv
│   ├── {file-id-2}.csv
│   └── ...
├── {workspace-id-2}/
│   ├── {file-id-3}.csv
│   └── ...
└── ...
```

This structure:
- Isolates files by workspace
- Prevents cross-workspace access via RLS
- Makes cleanup easier (delete entire workspace folder)
- Provides clear organization

## Verification

After creating the bucket, verify it works:

1. **Test Upload:**
   - Go to `/accounts` page
   - Click "Import" button
   - Upload a CSV file
   - Should proceed to column mapping (no 500 error)

2. **Check Storage:**
   - Go to Supabase Dashboard → Storage → csv-imports
   - You should see the uploaded file under your workspace ID folder

3. **Test Permissions:**
   - Try to upload as different users
   - Verify users can only see their workspace files

## Related Files

- **Upload Endpoint:** `web-app/src/app/api/upload/csv/route.ts`
- **Import Dialog:** `web-app/src/components/import/import-csv-dialog.tsx`
- **Worker:** `web-app/src/app/api/workers/import-csv/route.ts`

## Additional Notes

- **File Retention:** Consider adding a cron job to delete old CSV files (e.g., after 7 days)
- **Storage Limits:** Monitor storage usage and set quotas per workspace if needed
- **Security:** Never make this bucket public - files may contain sensitive customer data

## Status

- [x] Bug identified
- [ ] Storage bucket created in local Supabase
- [ ] Storage bucket created in production
- [x] Documentation created
- [ ] Tested end-to-end

---

*Created: 2025-10-25*
*Related to: F044 Data Pipeline - CSV Import Feature*
