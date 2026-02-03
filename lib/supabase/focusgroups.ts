import { supabase } from './client';
import { Database } from '@/types/database.types';

type FocusGroup = Database['public']['Tables']['focus_groups']['Row'];

/**
 * Fetch all focus groups
 */
export async function fetchFocusGroups() {
  const { data, error } = await supabase
    .from('focus_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's focus groups (groups they are a member of)
 */
export async function fetchUserFocusGroups() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) return [];

  const { data, error } = await supabase
    .from('focus_group_members')
    .select(`
      focus_group_id,
      status,
      focus_groups (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  
  return (data || []).map((item: any) => ({
    ...item.focus_groups,
    membership_status: item.status
  }));
}

/**
 * Get focus group by ID
 */
export async function getFocusGroup(focusGroupId: string) {
  const { data, error } = await supabase
    .from('focus_groups')
    .select('*')
    .eq('id', focusGroupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data;
}

/**
 * Apply to join a focus group
 */
export async function applyToFocusGroup(focusGroupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check if group is full and get group_id
  const { data: focusGroup } = await supabase
    .from('focus_groups')
    .select('available_spots, is_full, group_id')
    .eq('id', focusGroupId)
    .single();

  const status = (focusGroup as any)?.is_full ? 'waitlist' : 'active';

  // Add to focus group members
  const { error } = await supabase
    .from('focus_group_members')
    .insert({ 
      focus_group_id: focusGroupId, 
      user_id: userId,
      status 
    } as any);

  if (error) throw error;
  
  // If accepted (not waitlist) and group exists, add to the group chat
  if (status === 'active' && (focusGroup as any)?.group_id) {
    const { error: groupError } = await supabase
      .from('group_members')
      .insert({
        group_id: (focusGroup as any).group_id,
        user_id: userId,
        role: 'member'
      } as any);
    
    if (groupError) {
      console.error('Error adding to group:', groupError);
      // Don't throw error - focus group join was successful
    }
  }
  
  return { status };
}

/**
 * Check if user is member of focus group
 */
export async function isFocusGroupMember(focusGroupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) return { isMember: false, status: null };

  const { data, error } = await supabase
    .from('focus_group_members')
    .select('status')
    .eq('focus_group_id', focusGroupId)
    .eq('user_id', userId)
    .maybeSingle();

  return { 
    isMember: !!data, 
    status: (data as any)?.status || null 
  };
}

/**
 * Leave a focus group
 */
export async function leaveFocusGroup(focusGroupId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get group_id before leaving
  const { data: focusGroup } = await supabase
    .from('focus_groups')
    .select('group_id')
    .eq('id', focusGroupId)
    .single();

  // Remove from focus group members
  const { error } = await supabase
    .from('focus_group_members')
    .delete()
    .eq('focus_group_id', focusGroupId)
    .eq('user_id', userId);

  if (error) throw error;
  
  // Also remove from the associated group chat
  if ((focusGroup as any)?.group_id) {
    const { error: groupError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', (focusGroup as any).group_id)
      .eq('user_id', userId);
    
    if (groupError) {
      console.error('Error removing from group:', groupError);
      // Don't throw error - focus group leave was successful
    }
  }
}
