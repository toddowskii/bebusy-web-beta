# Message Attachments Storage Setup

## Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New Bucket**
4. Set bucket name: `message-attachments`
5. Make it **Public** (so users can view attachments)
6. Click **Create Bucket**

## Set Storage Policies

After creating the bucket, add these policies:

### Policy 1: Users can upload files
```sql
CREATE POLICY "Users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 2: Anyone can view files
```sql
CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');
```

### Policy 3: Users can delete their own files
```sql
CREATE POLICY "Users can delete their own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Run Database Migration

Run the SQL in `ADD_FILE_SUPPORT_TO_MESSAGES.sql` to add file columns to the messages table:

```bash
# In Supabase SQL Editor
```

This adds:
- `file_url` - URL to the uploaded file
- `file_type` - MIME type of the file
- `file_name` - Original filename
- Makes `content` nullable (for file-only messages)

## Supported File Types

- **Images**: PNG, JPG, GIF, WebP
- **Videos**: MP4, WebM, MOV
- **Documents**: PDF
- **Maximum file size**: 10MB

## Features

- ✅ File upload with progress indicator
- ✅ Image preview in chat
- ✅ Video player in chat
- ✅ PDF download links
- ✅ File type validation
- ✅ Size limit (10MB)
- ✅ Secure storage with RLS policies
