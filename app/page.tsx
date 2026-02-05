'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { fetchPosts } from '@/lib/supabase/posts'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { FeedSkeleton } from '@/components/PostSkeleton'
import { AppLayout } from '@/components/AppLayout'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      
      if (data.user) {
        const userProfile = await getCurrentProfile()
        setProfile(userProfile)
        
        // Check if user is banned
        if (userProfile?.role === 'banned') {
          console.log('Client: User is banned, redirecting to /banned')
          router.push('/banned')
          return
        }
      }
      
      setLoading(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadPosts()
    }
  }, [loading])

  const loadPosts = async () => {
    setLoadingPosts(true)
    try {
      const { posts: fetchedPosts } = await fetchPosts()
      setPosts(fetchedPosts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AppLayout username={profile?.username}>
      <div>
        {/* Create Post */}
        {profile && (
          <div style={{ marginBottom: '24px' }}>
            <CreatePost 
              userAvatar={profile.avatar_url}
              username={profile.username}
              onPostCreated={loadPosts}
            />
          </div>
        )}

        {/* Posts Feed */}
        {loadingPosts ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-[#ECEDEE]">No posts yet</h3>
            <p className="text-[#9BA1A6]">Be the first to share something!</p>
          </div>
        ) : (
          <div>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
