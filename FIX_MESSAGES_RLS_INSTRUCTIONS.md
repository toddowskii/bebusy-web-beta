# Fix Messages RLS Policies

The messaging feature is failing because the messages table is missing Row Level Security (RLS) policies.

## Error
`new row violates row-level security policy for table "messages"`

## Solution

Run the SQL in `FIX_MESSAGES_RLS.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `FIX_MESSAGES_RLS.sql`
5. Click **Run**

## What it does

The SQL script:
- Enables RLS on the messages table
- Creates policies allowing users to:
  - View messages in conversations they're part of
  - Insert messages in conversations they're part of (only their own messages)
  - Delete their own messages
  - Update messages in their conversations (for marking as read)

After running this SQL, users will be able to send and receive messages.
