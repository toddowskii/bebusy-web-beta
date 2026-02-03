# Complete Database Setup Checklist

Run these SQL scripts in your Supabase SQL Editor in this order:

## 1. Run: ADD_BANNED_UNTIL_COLUMN.sql
✅ Adds timeout functionality for bans

## 2. Run: CREATE_CONVERSATIONS_TABLE.sql  
✅ Sets up direct messaging

## 3. Run: CREATE_NOTIFICATIONS_TABLE.sql
✅ Sets up notification system

## 4. Run: ADD_GROUP_ID_TO_POSTS.sql
✅ Links posts to groups for group chats

## 5. Run: ADD_GROUP_TO_FOCUS_GROUPS.sql
✅ Links focus groups to their chat groups

## 6. Run: ADD_COVER_URL_COLUMN.sql (optional)
✅ Adds profile cover images

## 7. Run: BANNER_STORAGE_SETUP.sql (optional)
✅ Sets up storage for banners

## 8. Enable Row Level Security (RLS)

Make sure RLS is enabled for ALL tables and policies are set correctly.

### Critical RLS Policies Needed:

```sql
-- Banned users cannot create posts
CREATE POLICY "Banned users cannot create posts"
ON posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role != 'banned'
  )
);

-- Banned users cannot comment
CREATE POLICY "Banned users cannot comment"
ON comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role != 'banned'
  )
);

-- Banned users cannot like
CREATE POLICY "Banned users cannot like"
ON likes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role != 'banned'
  )
);

-- Banned users cannot message
CREATE POLICY "Banned users cannot send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role != 'banned'
  )
);
```

## 9. Storage Buckets Setup

Create these storage buckets in Supabase:
- `avatars` (public)
- `posts` (public)
- `banners` (public, optional)

Set RLS policies for storage buckets:
```sql
-- Anyone can view
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' OR bucket_id = 'posts' OR bucket_id = 'banners');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('avatars', 'posts', 'banners')
  AND auth.role() = 'authenticated'
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```
