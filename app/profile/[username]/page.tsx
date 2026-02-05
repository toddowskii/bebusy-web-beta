'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { fetchPosts } from '@/lib/supabase/posts'
import { followUser, unfollowUser, isFollowing } from '@/lib/supabase/profiles'
import { PostCard } from '@/components/PostCard'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Settings, MessageSquare, FileText, Image, Heart, Flag, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getOrCreateConversation } from '@/lib/supabase/messages'
import { createReport, type ReportReason } from '@/lib/supabase/reports'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
  const [profile, setProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes' | 'followers' | 'following'>('posts')
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      setCurrentUser(currentProfile)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !profileData) {
        toast.error('User not found')
        router.push('/')
        return
      }

      setProfile(profileData as any)

      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', (profileData as any).id)

      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', (profileData as any).id)

      setFollowersCount(followersCount || 0)
      setFollowingCount(followingCount || 0)

      setLoadingFollowers(true)
      setLoadingFollowing(true)

      const [followersData, followingData] = await Promise.all([
        supabase
          .from('followers')
          .select(`
            follower_id,
            profiles:follower_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('following_id', (profileData as any).id)
          .order('created_at', { ascending: false }),
        supabase
          .from('followers')
          .select(`
            following_id,
            profiles:following_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('follower_id', (profileData as any).id)
          .order('created_at', { ascending: false })
      ])

      if (followersData.error) {
        console.error('Error loading followers:', followersData.error)
        setFollowers([])
      } else {
        const cleanedFollowers = (followersData.data || [])
          .map((item: any) => item.profiles)
          .filter(Boolean)
        setFollowers(cleanedFollowers)
      }

      if (followingData.error) {
        console.error('Error loading following:', followingData.error)
        setFollowing([])
      } else {
        const cleanedFollowing = (followingData.data || [])
          .map((item: any) => item.profiles)
          .filter(Boolean)
        setFollowing(cleanedFollowing)
      }

      if (currentProfile && currentProfile.id !== (profileData as any).id) {
        const { isFollowing: following } = await isFollowing((profileData as any).id)
        setIsFollowingUser(following)
      }

      const { data: postsData } = await supabase
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
        .eq('user_id', (profileData as any).id)
        .is('group_id', null)
        .order('created_at', { ascending: false })

      if (postsData && currentProfile) {
        const postsWithLikeStatus = (postsData as any[]).map((post: any) => ({
          ...post,
          is_liked: post.likes?.some((like: any) => like.user_id === currentProfile.id) || false
        }))
        setPosts(postsWithLikeStatus)
      } else {
        setPosts(postsData || [])
      }

      const { data: likesData } = await supabase
        .from('likes')
        .select(`
          post_id,
          posts (
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
          )
        `)
        .eq('user_id', (profileData as any).id)
        .order('created_at', { ascending: false })

      if (likesData && currentProfile) {
        const likedPostsData = likesData
          .map((like: any) => like.posts)
          .filter((post: any) => post !== null)
          .map((post: any) => ({
            ...post,
            is_liked: post.likes?.some((like: any) => like.user_id === currentProfile.id) || false
          }))
        setLikedPosts(likedPostsData)
      } else if (likesData) {
        const likedPostsData = likesData
          .map((like: any) => like.posts)
          .filter((post: any) => post !== null)
        setLikedPosts(likedPostsData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoadingFollowers(false)
      setLoadingFollowing(false)
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !profile) return
    
    setIsFollowLoading(true)
    try {
      if (isFollowingUser) {
        await unfollowUser(profile.id)
        setIsFollowingUser(false)
        setFollowersCount(prev => prev - 1)
        toast.success('Unfollowed')
      } else {
        await followUser(profile.id)
        setIsFollowingUser(true)
        setFollowersCount(prev => prev + 1)
        toast.success('Following')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!currentUser || !profile) return
    
    try {
      const { conversationId, error } = await getOrCreateConversation(profile.id)
      if (error) {
        toast.error('Failed to start conversation')
        return
      }
      router.push(`/messages/${conversationId}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const handleReportUser = async () => {
    if (isReporting || !currentUser || !profile) return
    
    if (!reportDescription.trim()) {
      toast.error('Please provide a reason for your report')
      return
    }

    setIsReporting(true)
    try {
      const result = await createReport({
        reported_user_id: profile.id,
        content_type: 'user',
        reason: reportReason,
        description: reportDescription
      })

      if (result.error) throw new Error(result.error)

      toast.success('Report submitted')
      setShowReportModal(false)
      setReportReason('spam')
      setReportDescription('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report')
      console.error(error)
    } finally {
      setIsReporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <AppLayout username={currentUser?.username}>
      {/* Back Button */}
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#ECEDEE]" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#ECEDEE]">{profile.full_name || profile.username}</h2>
          <p className="text-sm text-[#8E8E93]">{posts.length} posts</p>
        </div>
      </div>

      {/* Profile Card with integrated banner */}
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] overflow-hidden" style={{ marginBottom: '24px' }}>
        {/* Cover Image */}
        {profile.cover_url ? (
          <div className="h-40 relative">
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-green-500/20 to-emerald-600/20 relative"></div>
        )}
        
        {/* Profile Info */}
        <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '16px' }}>
          {/* Avatar & Action */}
          <div className={`flex justify-between items-start ${profile.cover_url ? '-mt-12' : '-mt-10'} mb-4`}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#1C1C1E] ring-2 ring-[#2C2C2E]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-[#1C1C1E] ring-2 ring-[#2C2C2E]">
              {profile.username[0].toUpperCase()}
            </div>
          )}

          {/* Action Button */}
          {isOwnProfile ? (
            <Link
              href="/settings/edit-profile"
              className="mt-3 bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-full font-semibold transition-colors text-[#ECEDEE] flex items-center gap-2"
              style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end sm:items-start justify-end sm:justify-start">
              <button
                onClick={handleMessage}
                className="max-w-[180px] sm:max-w-none w-full sm:w-auto bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-full font-semibold transition-colors text-[#ECEDEE] flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-5"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`max-w-[180px] sm:max-w-none w-full sm:w-auto rounded-full font-semibold transition-all text-sm sm:text-base px-4 py-2 sm:px-6 ${
                  isFollowingUser
                    ? 'bg-[#2C2C2E] hover:bg-red-500/10 hover:border hover:border-red-500 text-[#ECEDEE] hover:text-red-500'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
              >
                {isFollowLoading ? '...' : isFollowingUser ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="max-w-[180px] sm:max-w-none w-full sm:w-auto bg-[#2C2C2E] hover:bg-yellow-500/10 rounded-full font-semibold transition-colors text-[#ECEDEE] hover:text-yellow-500 flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-4"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>
          )}
        </div>

        {/* Name & Username */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-[#FFFFFF]">{profile.full_name || profile.username}</h1>
          <p className="text-[#8E8E93]">@{profile.username}</p>
          {profile.role && (
            <p className="text-sm text-[#10B981] mt-1">{profile.role}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mb-3 text-[#ECEDEE] whitespace-pre-wrap">{profile.bio}</p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-[#8E8E93] text-sm mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Follow Stats */}
        <div className="flex gap-4 text-sm">
          <button className="hover:underline" onClick={() => setActiveTab('following')}>
            <span className="font-bold text-[#FFFFFF]">{followingCount}</span>
            <span className="text-[#8E8E93]"> Following</span>
          </button>
          <button className="hover:underline" onClick={() => setActiveTab('followers')}>
            <span className="font-bold text-[#FFFFFF]">{followersCount}</span>
            <span className="text-[#8E8E93]"> Followers</span>
          </button>
        </div>
      </div>
    </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'posts'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : 'text-[#8E8E93] bg-[#1C1C1E] hover:bg-[#2C2C2E]'
          }`}
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <FileText className="w-4 h-4" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'media'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : 'text-[#8E8E93] bg-[#1C1C1E] hover:bg-[#2C2C2E]'
          }`}
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Image className="w-4 h-4" />
          Media
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'likes'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : 'text-[#8E8E93] bg-[#1C1C1E] hover:bg-[#2C2C2E]'
          }`}
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Heart className="w-4 h-4" />
          Likes
        </button>
      </div>

      {/* Posts */}
      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-[#ECEDEE]">No posts yet</h3>
            <p className="text-[#9BA1A6]">
              {isOwnProfile ? "You haven't posted anything yet" : "This user hasn't posted anything yet"}
            </p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}

      {/* Media */}
      {activeTab === 'media' && (
        posts.filter(post => post.image_url || post.video_url).length === 0 ? (
          <div className="p-12 text-center">
            <Image className="w-16 h-16 text-[#2D2D2D] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[#ECEDEE]">No media yet</h3>
            <p className="text-[#9BA1A6]">
              {isOwnProfile ? "You haven't posted any media yet" : "This user hasn't posted any media yet"}
            </p>
          </div>
        ) : (
          <div>
            {posts.filter(post => post.image_url || post.video_url).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}

      {/* Likes */}
      {activeTab === 'likes' && (
        likedPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-5xl">❤️</div>
            <h3 className="text-xl font-semibold mb-2 text-[#ECEDEE]">No liked posts</h3>
            <p className="text-[#9BA1A6]">
              {isOwnProfile ? "You haven't liked any posts yet" : "This user hasn't liked any posts yet"}
            </p>
          </div>
        ) : (
          <div>
            {likedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}

      {/* Followers */}
      {activeTab === 'followers' && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveTab('posts')}
        >
          <div
            className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] w-full max-w-[320px] sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2C2C2E]" style={{ padding: '20px 24px' }}>
              <div>
                <h3 className="text-xl font-bold text-[#ECEDEE]">Followers</h3>
                <p className="text-sm text-[#9BA1A6]" style={{ marginTop: '2px' }}>
                  {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('posts')}
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#9BA1A6]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {loadingFollowers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-[#9BA1A6] mx-auto" style={{ marginBottom: '12px' }} />
                  <p className="text-[#9BA1A6]">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {followers.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 hover:bg-[#2C2C2E] rounded-xl transition-colors"
                      style={{ padding: '12px' }}
                      onClick={() => setActiveTab('posts')}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-[#2C2C2E]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-[#2C2C2E]">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#ECEDEE] truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-[#9BA1A6] truncate" style={{ marginTop: '2px' }}>
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following */}
      {activeTab === 'following' && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveTab('posts')}
        >
          <div
            className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] w-full max-w-[320px] sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2C2C2E]" style={{ padding: '20px 24px' }}>
              <div>
                <h3 className="text-xl font-bold text-[#ECEDEE]">Following</h3>
                <p className="text-sm text-[#9BA1A6]" style={{ marginTop: '2px' }}>
                  {following.length} {following.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('posts')}
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#9BA1A6]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {loadingFollowing ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-[#9BA1A6] mx-auto" style={{ marginBottom: '12px' }} />
                  <p className="text-[#9BA1A6]">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {following.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 hover:bg-[#2C2C2E] rounded-xl transition-colors"
                      style={{ padding: '12px' }}
                      onClick={() => setActiveTab('posts')}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-[#2C2C2E]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-[#2C2C2E]">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#ECEDEE] truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-[#9BA1A6] truncate" style={{ marginTop: '2px' }}>
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && !isOwnProfile && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] max-w-md w-full"
            style={{ padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-[#FFFFFF]">Report User</h3>
              </div>

              <p className="text-[#9BA1A6] text-sm" style={{ marginBottom: '20px' }}>
                Help us understand what's wrong with this user.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label className="block text-sm font-medium text-[#FFFFFF]" style={{ marginBottom: '8px' }}>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-4 py-3 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl text-[#FFFFFF] focus:outline-none focus:border-green-500"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="block text-sm font-medium text-[#FFFFFF]" style={{ marginBottom: '8px' }}>
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please explain why you're reporting this..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl text-[#FFFFFF] placeholder-[#8E8E93] focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={isReporting}
                  className="flex-1 px-8 py-4 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#FFFFFF] font-semibold rounded-full transition-colors disabled:opacity-50 text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportUser}
                  disabled={isReporting || !reportDescription.trim()}
                  className="flex-1 px-8 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white font-semibold rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  style={{ boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.2)' }}
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
