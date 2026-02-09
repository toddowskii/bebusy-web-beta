import { supabase } from './client';
import { getCurrentProfile } from './profiles';
import { Database } from '@/types/database.types';

type FocusGroup = Database['public']['Tables']['focus_groups']['Row'];

/**
 * Fetch all focus groups
 */
export async function fetchFocusGroups(tags?: string[]) {
  let query: any = supabase
    .from('focus_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's focus groups (groups they are a member of)
 */
export async function fetchUserFocusGroups(tags?: string[]) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) return [];

  // Get memberships to find focus_group_ids
  const { data: memberships, error: memErr } = await supabase
    .from('focus_group_members')
    .select('focus_group_id')
    .eq('user_id', userId);

  if (memErr) throw memErr;

  const ids = (memberships || []).map((m: any) => m.focus_group_id).filter(Boolean);
  if (ids.length === 0) return [];

  let query: any = supabase
    .from('focus_groups')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
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

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('focus_group_members')
    .select('id')
    .eq('focus_group_id', focusGroupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    throw new Error('You are already a member of this focus group');
  }

  // Get user's profile to check role
  const userProfile = await getCurrentProfile();
  const isAdminOrMentor = userProfile?.role === 'admin' || userProfile?.role === 'mentor';

  // Check if group is full and get group_id
  const { data: focusGroup, error: fetchError } = await supabase
    .from('focus_groups')
    .select('available_spots, is_full, group_id, total_spots')
    .eq('id', focusGroupId)
    .single();

  if (fetchError) {
    console.error('Error fetching focus group:', fetchError);
    throw new Error('Focus group not found');
  }

  // For regular users: check if group is full
  // For admins/mentors: they can always join
  let status = 'active';
  
  if (!isAdminOrMentor) {
    status = (focusGroup as any)?.is_full ? 'waitlist' : 'active';
    
    // For regular users, check if there are available spots
    if ((focusGroup as any)?.available_spots <= 0 && status === 'active') {
      status = 'waitlist';
    }
  }

  // Add to focus group members
  const { error } = await supabase
    .from('focus_group_members')
    .insert({ 
      focus_group_id: focusGroupId, 
      user_id: userId,
      status 
    } as any);

  if (error) {
    console.error('Error inserting focus group member:', error);
    throw new Error(error.message || 'Failed to join focus group');
  }
  
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

  // Get user's profile to check role
  const userProfile = await getCurrentProfile();
  const isAdminOrMentor = userProfile?.role === 'admin' || userProfile?.role === 'mentor';

  // Get group_id and current member status before leaving
  const { data: focusGroup } = await supabase
    .from('focus_groups')
    .select('group_id, available_spots, total_spots')
    .eq('id', focusGroupId)
    .single();

  // Get member status to know if they were active
  const { data: memberData } = await supabase
    .from('focus_group_members')
    .select('status')
    .eq('focus_group_id', focusGroupId)
    .eq('user_id', userId)
    .single();

  const wasActive = (memberData as any)?.status === 'active';

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
