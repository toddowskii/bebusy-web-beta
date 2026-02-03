# Enable Real-time Messaging in Supabase

Your app already has real-time subscriptions implemented in the code, but you need to **enable Realtime on your Supabase tables** for messages to appear instantly across devices.

## Steps to Enable Realtime:

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com

### 2. Select Your Project
Navigate to your `bebusy` project

### 3. Enable Realtime for Messages Table

1. Go to **Database** → **Replication** (in the left sidebar)
2. Find the `messages` table in the list
3. Click the toggle to **enable replication** for the `messages` table
4. Click **Save**

### 4. Enable Realtime for Posts Table (for group chats)

1. In the same **Replication** page
2. Find the `posts` table
3. Click the toggle to **enable replication** for the `posts` table
4. Click **Save**

### 5. Verify Realtime is Working

1. Open your app in two different browsers (or devices)
2. Login as different users
3. Send a message from one user
4. The message should appear **instantly** on the other device

## Alternative Method (SQL):

If the UI method doesn't work, run this SQL in your Supabase SQL Editor:

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for posts table (for group chats)
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
```

## What This Does:

- **Realtime subscriptions** listen for INSERT events on these tables
- When a new message is inserted, all connected clients receive the update **immediately**
- Your app already has the subscription code - it just needs the database to broadcast changes

## Already Implemented in Code:

✅ Direct messages: Real-time subscription in `/messages/[id]/page.tsx`
✅ Group chats: Real-time subscription in `/messages/group/[id]/page.tsx`
✅ Optimistic updates: Messages appear instantly for the sender
✅ Real-time sync: Messages sync across all connected devices (once Realtime is enabled)

## Troubleshooting:

If messages still don't appear instantly after enabling Realtime:

1. **Check browser console** for errors
2. **Verify RLS policies** allow reading messages
3. **Test connection**: Open Network tab, look for WebSocket connection to Supabase
4. **Clear cache** and reload the page
5. **Check Supabase logs** in Dashboard → Logs → Realtime

## Notes:

- Optimistic updates ensure the sender sees their message **immediately**
- Real-time subscriptions ensure other users see messages **instantly** (once enabled)
- The subscription automatically handles new messages and adds them to the chat
