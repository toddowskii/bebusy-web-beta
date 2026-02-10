import { supabase } from './client';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return (data as any)?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role } as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a focus group (admin/mentor only)
 */
export async function createFocusGroup(focusGroup: {
  title: string;
  description: string;
  mentor_name: string;
  mentor_role: string;
  mentor_image_url?: string;
  total_spots: number;
  start_date?: string;
  end_date?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Ensure the current user is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    throw new Error('Only admins can create focus groups')
  }

  // First, create the associated group for communication
  const { data: groupData, error: groupError } = await supabaseAdmin
    .from('groups')
    .insert({
      name: `${focusGroup.title} - Group Chat`,
      description: `Private group chat for ${focusGroup.title} focus group members`,
      created_by: user?.id,
      members_count: 0,
    } as any)
    .select()
    .single();

  if (groupError) throw groupError;

  // Then create the focus group with the group_id
  const { data, error } = await supabaseAdmin
    .from('focus_groups')
    .insert({
      ...focusGroup,
      mentor_id: user?.id,
      available_spots: focusGroup.total_spots,
      is_full: false,
      group_id: groupData.id,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update focus group
 */
export async function updateFocusGroup(
  focusGroupId: string,
  updates: {
    title?: string;
    description?: string;
    total_spots?: number;
    start_date?: string;
    end_date?: string;
  }
) {
  const { data, error } = await supabaseAdmin
    .from('focus_groups')
    .update(updates as any)
    .eq('id', focusGroupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete focus group
 */
export async function deleteFocusGroup(focusGroupId: string) {
  // First, fetch the focus group so we know the associated group_id (if any)
  const { data: focusGroup, error: fetchError } = await supabaseAdmin
    .from('focus_groups')
    .select('id, group_id')
    .eq('id', focusGroupId)
    .maybeSingle();

  if (fetchError) {
    // If not found, surface the error
    throw fetchError;
  }

  // Delete the focus group record
  const { error } = await supabaseAdmin
    .from('focus_groups')
    .delete()
    .eq('id', focusGroupId);

  if (error) throw error;

  // If there is an associated group chat, delete its members and the group itself
  const groupId = (focusGroup as any)?.group_id;
  if (groupId) {
    const { error: membersError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', groupId);
    if (membersError) throw membersError;

    const { error: groupError } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', groupId);
    if (groupError) throw groupError;
  }
}

/**
 * Ban a user (admin only)
 */
export async function banUser(userId: string, reason?: string, durationHours?: number) {
  const bannedUntil = durationHours 
    ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'banned',
      bio: reason ? `[BANNED] ${reason}` : '[BANNED]',
      banned_until: bannedUntil
    } as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'user',
      bio: null,
      banned_until: null
    } as any)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check and auto-unban users whose timeout has expired
 */
export async function checkExpiredBans() {
  const now = new Date().toISOString();
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'user',
      bio: null,
      banned_until: null
    } as any)
    .eq('role', 'banned')
    .not('banned_until', 'is', null)
    .lte('banned_until', now)
    .select();

  if (error) throw error;
  return data;
}
