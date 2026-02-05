import { supabase } from './client';
import { Database } from '@/types/database.types';
import { createNotification } from './notifications';
import { sanitizePlainText, containsScriptLike } from '@/lib/security/sanitize';
import { validateContent } from '@/lib/security/moderation';

type Post = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];

export interface PostWithProfile extends Post {
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string | null;
  };
  user_has_liked?: boolean;
}

/**
 * Fetch posts for the feed with user profiles
 */
export async function fetchPosts(limit: number = 20, offset: number = 0) {
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
    .is('group_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], error };
  }

  // Filter out posts without valid profiles
  const validPosts = (data as any[])?.filter(post => post.profiles) || [];

  // Check if current user has liked each post
  if (userId && validPosts.length > 0) {
    const postsWithLikeStatus = validPosts.map(post => ({
      ...post,
      is_liked: post.likes?.some((like: any) => like.user_id === userId) || false
    }));

    return { posts: postsWithLikeStatus as any[], error: null };
  }

  return { posts: validPosts as any[], error: null };
}

/**
 * Create a new post
 */
export async function createPost(content: string, imageUrl?: string | null, groupId?: string | null) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // Check if user is banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if ((profile as any)?.role === 'banned') {
    return { data: null, error: new Error('Your account has been banned. You cannot create posts.') };
  }

  if (containsScriptLike(content)) {
    return { data: null, error: new Error('Scripts are not allowed in posts.') };
  }

  const sanitizedContent = sanitizePlainText(content);

  if (!sanitizedContent && !imageUrl) {
    return { data: null, error: new Error('Post must include text or an image.') };
  }

  if (sanitizedContent) {
    // Validate and sanitize content
    const validation = validateContent(sanitizedContent);
    if (!validation.isValid) {
      return { data: null, error: new Error(validation.error) };
    }
  }

  const newPost: PostInsert = {
    user_id: userId,
    content: sanitizedContent,
    image_url: imageUrl || undefined,
    group_id: groupId || undefined,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(newPost as any)
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return { data: null, error };
  }

  return { data: data as PostWithProfile, error: null };
}

/**
 * Like a post
 */
export async function likePost(postId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await supabase
    .from('likes')
    .insert({ post_id: postId, user_id: userId } as any);

  if (error) {
    console.error('Error liking post:', error);
    return { error };
  }

  // Get post author and create notification
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, content')
    .eq('id', postId)
    .single();

  if (post) {
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    await createNotification({
      userId: (post as any).user_id,
      type: 'like',
      content: `${(currentUser as any)?.username || 'Someone'} liked your post`,
      relatedId: postId,
    });
  }

  return { error: null };
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unliking post:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return { data: null, error };
  }

  return { data: data as PostWithProfile, error: null };
}

/**
 * Delete a post
 */
export async function deletePost(postId: string) {
  try {
    // Get current user's session token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { error: new Error('Not authenticated') }
    }

    // Call the API route which has access to service role key
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: new Error(data.error || 'Failed to delete post') }
    }

    return { error: null }
  } catch (error) {
    console.error('Error deleting post:', error)
    return { error: error as Error }
  }
}
