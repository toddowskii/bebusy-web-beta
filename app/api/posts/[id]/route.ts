import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    // Get the user's session from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create client with anon key to verify user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to check user's role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check user's role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    console.log('User profile:', profile, 'User ID:', user.id)
    const isAdmin = (profile as any)?.role === 'admin'
    console.log('Is user admin?', isAdmin, 'Profile role:', (profile as any)?.role)

    // Use service role to check post existence if admin, otherwise use regular client
    const clientToCheck = isAdmin
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase

    // Get the post to check ownership
    const { data: post, error: postError } = await clientToCheck
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('Error fetching post:', postError)
    }

    if (!post) {
      console.log('Post not found. postId:', postId, 'isAdmin:', isAdmin, 'hasServiceKey:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user owns the post or is admin
    if (post.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role if admin, otherwise use regular client
    if (isAdmin) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Regular user - use normal client (RLS will check ownership)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete post API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
