import { supabase } from './client';
import { Database } from '@/types/database.types';
import { validateImageUpload } from '@/lib/security/upload';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentProfile:', error);
    return null;
  }
}

/**
 * Get profile by ID
 */
export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a new profile
 */
export async function createProfile(profile: ProfileInsert): Promise<Profile | null> {
  try {
    // Try to update first (in case profile was created by trigger)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id!)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
        } as any)
        .eq('id', profile.id!)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Insert new profile if doesn't exist
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference issue with generics
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(userId: string, dataUrl: string): Promise<string | null> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Validate file
    const file = new File([blob], 'avatar.jpg', { type: blob.type });
    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      console.error('Avatar validation failed:', validation.error);
      throw new Error(validation.error);
    }

    // Determine file extension from blob type
    const fileExt = blob.type.split('/')[1] || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

/**
 * Upload banner/cover image to Supabase Storage
 */
export async function uploadBanner(userId: string, dataUrl: string): Promise<string | null> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Validate file
    const file = new File([blob], 'banner.jpg', { type: blob.type });
    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      console.error('Banner validation failed:', validation.error);
      throw new Error(validation.error);
    }

    // Determine file extension from blob type
    const fileExt = blob.type.split('/')[1] || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading banner:', error);
    return null;
  }
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges:badge_id (
        id,
        name,
        description,
        icon
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user badges:', error);
    return { data: [], error };
  }

  return { data, error: null };
}

/**
 * Follow a user
 */
export async function followUser(followingId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await supabase
    .from('followers')
    .insert({ follower_id: userId, following_id: followingId } as any);

  if (error) {
    console.error('Error following user:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if current user follows another user
 */
export async function isFollowing(followingId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { isFollowing: false, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', followingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking follow status:', error);
    return { isFollowing: false, error };
  }

  return { isFollowing: !!data, error: null };
}
