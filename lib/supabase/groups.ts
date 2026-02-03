import { supabase } from './client';
import { Database } from '@/types/database.types';

/**
 * Create a new group
 */
export async function createGroup(name: string, description: string, isPrivate: boolean = false) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      created_by: userId,
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Add creator as member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: (data as any).id,
      user_id: userId,
      role: 'admin'
    } as any);

  if (memberError) throw memberError;

  return data;
}

/**
 * Update a group
 */
export async function updateGroup(groupId: string, name: string, description: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const updateData = {
    name,
    description,
  };

  const { data, error } = await (supabase as any)
    .from('groups')
    .update(updateData)
    .eq('id', groupId)
    .eq('created_by', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all groups (excluding focus group chats)
 */
export async function fetchGroups() {
  // Get all focus group IDs that have associated groups
  const { data: focusGroups } = await supabase
    .from('focus_groups')
    .select('group_id')
    .not('group_id', 'is', null);

  const focusGroupIds = focusGroups?.map((fg: any) => fg.group_id).filter(Boolean) || [];

  let query = supabase
    .from('groups')
    .select(`
      *,
      profiles:created_by (
        id,
        username,
        full_name,
        avatar_url
      ),
      group_members (
        id
      )
    `)
    .order('created_at', { ascending: false });

  // Filter out focus group chats
  if (focusGroupIds.length > 0) {
    query = query.not('id', 'in', `(${focusGroupIds.join(',')})`)
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's groups (groups they are a member of, excluding focus group chats)
 */
export async function fetchUserGroups() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) return [];

  // Get all focus group IDs that have associated groups
  const { data: focusGroups } = await supabase
    .from('focus_groups')
    .select('group_id')
    .not('group_id', 'is', null);

  const focusGroupIds = focusGroups?.map((fg: any) => fg.group_id).filter(Boolean) || [];

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      groups (
        *,
        profiles:created_by (
          id,
          username,
          full_name,
          avatar_url
        ),
        group_members (
          id
        )
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  
  // Filter out focus group chats
  const filteredData = (data || []).filter((item: any) => 
    !focusGroupIds.includes(item.group_id)
  );
  
  return filteredData.map((item: any) => ({
    ...item.groups,
    user_role: item.role
  }));
}

/**
 * Get a single group by ID
 */
export async function getGroup(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      profiles:created_by (
        id,
        username,
        full_name,
        avatar_url
      ),
      group_members (
        id,
        user_id,
        role
      )
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }
  return data;
}

/**
 * Join a group
 */
export async function joinGroup(groupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    } as any);

  if (error) throw error;
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if user is member of group
 */
export async function isMember(groupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) return false;

  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

/**
 * Get group posts
 */
export async function getGroupPosts(groupId: string) {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes (
          id,
          user_id
        ),
        comments (
          id
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      // group_id column might not exist yet
      console.warn('Error fetching group posts:', error);
      return [];
    }

    if (userId && data) {
      const postsWithLikeStatus = (data as any[]).map((post: any) => ({
        ...post,
        is_liked: post.likes?.some((like: any) => like.user_id === userId) || false
      }));
      return postsWithLikeStatus;
    }

    return data || [];
  } catch (error) {
    console.warn('Error in getGroupPosts:', error);
    return [];
  }
}

/**
 * Create a post in a group
 */
export async function createGroupPost(groupId: string, content: string, imageUrl?: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content,
      image_url: imageUrl,
      group_id: groupId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}
