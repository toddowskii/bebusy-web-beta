import { supabase } from './client';

/**
 * Search for users by username, full name, or bio
 */
export async function searchUsers(query: string) {
  try {
    const searchTerm = `${query}%`;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role')
      .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
      .neq('role', 'banned')
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}

/**
 * Search for posts by content
 */
export async function searchPosts(query: string, currentUserId?: string) {
  try {
    const searchTerm = `%${query}%`;
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role
        ),
        likes (
          id,
          user_id
        ),
        comments (
          id
        )
      `)
      .ilike('content', searchTerm)
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching posts:', error);
      return [];
    }

    // Add is_liked status if user is logged in
    if (currentUserId && data) {
      const postsWithLikeStatus = data.map((post: any) => ({
        ...post,
        is_liked: post.likes?.some((like: any) => like.user_id === currentUserId) || false
      }));
      return postsWithLikeStatus;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchPosts:', error);
    return [];
  }
}

/**
 * Search for groups by name or description
 */
export async function searchGroups(query: string) {
  try {
    const searchTerm = `${query}%`;
    
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, description, members_count, created_at')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      console.error('Error searching groups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchGroups:', error);
    return [];
  }
}

/**
 * Search for users by tags (projects/skills). Returns profiles that have projects with matching technologies/tags.
 */
export async function searchUsersByTags(tags: string[], query?: string) {
  try {
    if (!tags || tags.length === 0) return []

    // Find matching user_ids from portfolio_projects where technologies overlap
    const { data: projects, error: projErr } = await supabase
      .from('portfolio_projects')
      .select('user_id')
      .overlaps('technologies', tags)
      .limit(500)

    if (projErr) {
      console.error('Error searching projects by tags:', projErr)
      return []
    }

    const userIds = Array.from(new Set((projects || []).map((p: any) => p.user_id))).slice(0, 200)
    if (userIds.length === 0) return []

    let builder = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role')
      .in('id', userIds)

    if (query && query.trim().length > 0) {
      const q = `${query}%`
      builder = builder.or(`username.ilike.${q},full_name.ilike.${q}`)
    }

    const { data, error } = await builder.limit(50)
    if (error) {
      console.error('Error fetching profiles by tags:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchUsersByTags:', error)
    return []
  }
}
