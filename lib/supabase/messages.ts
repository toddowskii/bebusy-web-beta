import { supabase } from './client';
import { Database } from '@/types/database.types';

/**
 * Get user's group chats (only focus group chats, not regular groups)
 */
export async function getUserGroupChats() {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      return [];
    }

    // Get all focus group IDs that have associated groups
    const { data: focusGroups } = await supabase
      .from('focus_groups')
      .select('group_id')
      .not('group_id', 'is', null);

    const focusGroupIds = focusGroups?.map(fg => fg.group_id).filter(Boolean) || [];

    // Only get groups that are associated with focus groups
    const { data: groupMemberships, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        groups (
          id,
          name,
          description,
          members_count,
          created_at
        )
      `)
      .eq('user_id', userId)
      .in('group_id', focusGroupIds);

    if (error) {
      console.error('Error fetching group chats:', error);
      return [];
    }

    // For each group, get the last message
    const groupsWithLastMessage = await Promise.all(
      (groupMemberships || []).map(async (membership: any) => {
        const group = membership.groups;
        
        // Get last message in group (via posts)
        const { data: posts } = await supabase
          .from('posts')
          .select('id, content, created_at, user_id')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          id: group.id,
          type: 'group',
          name: group.name,
          description: group.description,
          members_count: group.members_count,
          lastMessage: posts?.[0] || null,
          updated_at: (posts?.[0] as any)?.created_at || (group as any).created_at,
        };
      })
    );

    return groupsWithLastMessage;
  } catch (error) {
    console.error('Error in getUserGroupChats:', error);
    return [];
  }
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(otherUserId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check if conversation exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
    .single();

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user1_id: userId,
      user2_id: otherUserId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all conversations for current user
 */
export async function getConversations() {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      return [];
    }

    // Get all conversations where user is participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return [];
    }

    // For each conversation, get the other user's profile and last message
    const conversationsWithData = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
        
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, created_at, file_url, file_type, file_name')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          id: conv.id,
          otherUser: profile,
          lastMessage: messages?.[0] || null,
          updated_at: conv.updated_at,
        };
      })
    );

    return conversationsWithData.filter(c => c.otherUser);
  } catch (error) {
    console.error('Error in getConversations:', error);
    return [];
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string, 
  content?: string | null, 
  fileUrl?: string | null,
  fileType?: string | null,
  fileName?: string | null
) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check if user is banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'banned') {
    throw new Error('Your account has been banned. You cannot send messages.');
  }

  console.log('Attempting to send message:', { conversationId, userId, contentLength: content?.length, hasFile: !!fileUrl });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content || null,
      is_read: false,
      file_url: fileUrl || null,
      file_type: fileType || null,
      file_name: fileName || null,
    })
    .select(`
      *,
      profiles:sender_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error sending message:', JSON.stringify(error, null, 2));
    throw new Error(error.message || error.details || error.hint || 'Failed to send message');
  }

  if (!data) {
    throw new Error('No data returned from message insert');
  }

  console.log('Message sent successfully:', data.id);

  // Update conversation timestamp
  await (supabase
    .from('conversations') as any)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Verify user owns the message
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();

  if ((message as any)?.sender_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

/**
 * Upload a file for messaging
 */
export async function uploadMessageFile(file: File, conversationId: string): Promise<{ url: string; type: string; name: string }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${conversationId}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    type: file.type,
    name: file.name
  };
}
