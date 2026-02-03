-- Add file support to messages table

-- Add file_url and file_type columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Make content optional when file is attached
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
