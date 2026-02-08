import { supabase } from './client';

/**
 * Check if user is mentor or admin
 */
export async function isMentor(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return (data as any)?.role === 'mentor' || (data as any)?.role === 'admin';
  } catch (error) {
    console.error('Error checking mentor status:', error);
    return false;
  }
}

/**
 * Get mentor's own focus groups
 */
export async function getMentorFocusGroups() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_groups')
    .select('*')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create focus group (mentor)
 */
export async function createMentorFocusGroup(focusGroup: {
  title: string;
  description: string;
  mentor_name: string;
  mentor_role: string;
  total_spots: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, create the associated group for communication
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: `${focusGroup.title} - Group Chat`,
      description: `Private group chat for ${focusGroup.title} focus group members`,
      created_by: user.id,
      members_count: 0,
      tags: focusGroup.tags || null,
    } as any)
    .select()
    .single();

  if (groupError) throw groupError;

  // Then create the focus group with the group_id
  const { data, error } = await supabase
    .from('focus_groups')
    .insert({
      title: focusGroup.title,
      description: focusGroup.description,
      mentor_name: focusGroup.mentor_name,
      mentor_role: focusGroup.mentor_role,
      total_spots: focusGroup.total_spots,
      available_spots: focusGroup.total_spots,
      is_full: false,
      mentor_id: user.id,
      start_date: focusGroup.start_date || null,
      end_date: focusGroup.end_date || null,
      tags: focusGroup.tags || null,
      group_id: (groupData as any).id,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update mentor's own focus group
 */
export async function updateMentorFocusGroup(
  focusGroupId: string,
  updates: {
    title?: string;
    description?: string;
    mentor_name?: string;
    mentor_role?: string;
    total_spots?: number;
    start_date?: string;
    end_date?: string;
    tags?: string[];
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await (supabase as any)
    .from('focus_groups')
    .update(updates as any)
    .eq('id', focusGroupId)
    .eq('mentor_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete mentor's own focus group
 */
export async function deleteMentorFocusGroup(focusGroupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('focus_groups')
    .delete()
    .eq('id', focusGroupId)
    .eq('mentor_id', user.id);

  if (error) throw error;
}
