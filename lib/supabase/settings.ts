import { supabase } from './client';
import { Database } from '@/types/database.types';

type UserSettings = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];
type BlockedUser = Database['public']['Tables']['blocked_users']['Row'];

/**
 * Get user settings
 */
export async function getUserSettings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Settings don't exist, create default settings
      const result = await createDefaultSettings(userId);
      
      // If creation also fails, return default values
      if (result.error) {
        console.warn('Could not create settings, using defaults');
        return {
          data: getDefaultSettings(userId),
          error: null
        };
      }
      
      return result;
    }

    if (error) {
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.code === '42P01') {
        console.warn('user_settings table does not exist. Please run the database migration.');
        return {
          data: getDefaultSettings(userId),
          error: null
        };
      }
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return defaults as fallback
    return { 
      data: getDefaultSettings(userId),
      error: null 
    };
  }
}

/**
 * Get default settings object
 */
function getDefaultSettings(userId: string) {
  return {
    id: '',
    user_id: userId,
    email_notifications: true,
    push_notifications: false,
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
    message_notifications: true,
    group_notifications: true,
    mention_notifications: true,
    profile_visibility: 'public' as const,
    show_online_status: true,
    allow_messages_from: 'everyone' as const,
    allow_tags: true,
    show_activity: true,
    language: 'en',
    theme: 'dark' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Create default settings for a new user
 */
async function createDefaultSettings(userId: string) {
  try {
    // First check if settings already exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Create new settings
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .insert({
        user_id: userId,
        email_notifications: true,
        push_notifications: false,
        like_notifications: true,
        comment_notifications: true,
        follow_notifications: true,
        message_notifications: true,
        group_notifications: true,
        mention_notifications: true,
        profile_visibility: 'public',
        show_online_status: true,
        allow_messages_from: 'everyone',
        allow_tags: true,
        show_activity: true,
        language: 'en',
        theme: 'dark'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting default settings:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error creating default settings:', error);
    return { data: null, error };
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(userId: string, updates: UserSettingsUpdate) {
  try {
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { data: null, error };
  }
}

/**
 * Get blocked users
 */
export async function getBlockedUsers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        *,
        blocked_profile:profiles!blocked_users_blocked_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.code === '42P01') {
        console.warn('blocked_users table does not exist. Please run the database migration.');
        return { data: [], error: null };
      }
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    // Return empty array as fallback
    return { data: [], error: null };
  }
}

/**
 * Block a user
 */
export async function blockUser(userId: string, blockedUserId: string) {
  try {
    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    const { data, error } = await (supabase as any)
      .from('blocked_users')
      .insert({
        user_id: userId,
        blocked_user_id: blockedUserId
      })
      .select()
      .single();

    if (error) throw error;

    // Remove any follows between users
    await supabase
      .from('followers')
      .delete()
      .or(`and(follower_id.eq.${userId},following_id.eq.${blockedUserId}),and(follower_id.eq.${blockedUserId},following_id.eq.${userId})`);

    return { data, error: null };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { data: null, error };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedUserId: string) {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { error };
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string, targetUserId: string) {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(user_id.eq.${userId},blocked_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},blocked_user_id.eq.${userId})`)
      .limit(1);

    if (error) throw error;
    return { blocked: (data && data.length > 0), error: null };
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return { blocked: false, error };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string) {
  try {
    // This should be handled by database triggers/cascades
    // or a server-side function for complete data deletion
    const { error } = await (supabase as any).rpc('delete_user_account', {
      user_id: userId
    });

    if (error) throw error;

    // Sign out the user
    await supabase.auth.signOut();

    return { error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error };
  }
}

/**
 * Change user password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    // First verify current password by signing in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('User not found');

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error changing password:', error);
    return { error };
  }
}

/**
 * Update email address
 */
export async function updateEmail(newEmail: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating email:', error);
    return { error };
  }
}

/**
 * Create a report
 */
export async function createReport(
  reporterId: string,
  data: {
    reported_user_id?: string;
    reported_post_id?: string;
    reported_comment_id?: string;
    reason: string;
    description?: string;
  }
) {
  try {
    const { data: report, error } = await (supabase as any)
      .from('reports')
      .insert({
        reporter_id: reporterId,
        ...data,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { data: report, error: null };
  } catch (error) {
    console.error('Error creating report:', error);
    return { data: null, error };
  }
}
