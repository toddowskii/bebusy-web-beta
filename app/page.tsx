'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Home, Users, MessageSquare, Bell, User, Target, Settings } from 'lucide-react'
import { fetchPosts } from '@/lib/supabase/posts'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { CreatePost } from '@/components/CreatePost'
import { PostCard } from '@/components/PostCard'
import { FeedSkeleton } from '@/components/PostSkeleton'

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#000000] border-b border-[#2D2D2D] z-50">
        <div className="h-14 flex items-center justify-between" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <h1 className="text-xl font-bold text-[#10B981]">BeBusy</h1>
          
          <div className="flex items-center gap-2">
            <Link href="/settings/account" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
            <Link href="/notifications" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
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
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#2D2D2D] z-50">
        <div className="h-16 flex items-center justify-around" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <Link href="/" className="flex flex-col items-center gap-1 text-[#10B981]">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link href="/groups" className="flex flex-col items-center gap-1 text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors">
            <Users className="w-6 h-6" />
            <span className="text-xs">Groups</span>
          </Link>
          <Link href="/focus-groups" className="flex flex-col items-center gap-1 text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors">
            <Target className="w-6 h-6" />
            <span className="text-xs">Focus</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center gap-1 text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors">
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Messages</span>
          </Link>
          <Link href={`/profile/${profile?.username}`} className="flex flex-col items-center gap-1 text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
