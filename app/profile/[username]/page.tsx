'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { fetchPosts } from '@/lib/supabase/posts'
import { followUser, unfollowUser, isFollowing } from '@/lib/supabase/profiles'
import { PostCard } from '@/components/PostCard'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Settings, MessageSquare, FileText, Image, Heart, Flag, Users, X, Flame, Briefcase, Star, Share2 } from 'lucide-react'
import { categorizeTag, badgeClassForCategory } from '@/lib/tagCategories'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getOrCreateConversation } from '@/lib/supabase/messages'
import { createReport, type ReportReason } from '@/lib/supabase/reports'
import { getUserStreak } from '@/lib/supabase/checkins'
import { getUserPortfolio } from '@/lib/supabase/portfolio'

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
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes' | 'portfolio' | 'followers' | 'following'>('posts')
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [userStreak, setUserStreak] = useState<any>(null)
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([])

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

      // Load user streak
      const { data: streakData } = await getUserStreak((profileData as any).id)
      if (streakData) {
        setUserStreak(streakData)
      }

      // Load featured projects
      const { data: portfolioData } = await getUserPortfolio((profileData as any).id)
      if (portfolioData) {
        const featured = portfolioData.filter((p: any) => p.is_featured)
        setFeaturedProjects(featured)
      }

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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
        <button onClick={() => router.back()} className="p-2 hover:bg-card rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{profile.full_name || profile.username}</h2>
          <p className="text-sm text-muted-foreground">{posts.length} posts</p>
        </div>
      </div>

      {/* Profile Card with integrated banner */}
      <div className="bg-card rounded-[20px] border border-border overflow-hidden" style={{ marginBottom: '24px' }}>
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
              className="w-24 h-24 rounded-full object-cover border-4 border-card ring-2 ring-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-card ring-2 ring-border">
              {profile.username[0].toUpperCase()}
            </div>
          )}

          {/* Action Button */}
          {isOwnProfile ? (
            <Link
              href="/settings/edit-profile"
              className="mt-3 bg-muted hover:bg-accent rounded-full font-semibold transition-colors text-foreground flex items-center gap-2"
              style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end sm:items-start justify-end sm:justify-start">
              <button
                onClick={handleMessage}
                className="max-w-[180px] sm:max-w-none w-full sm:w-auto bg-muted hover:bg-accent rounded-full font-semibold transition-colors text-foreground flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-5"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`max-w-[180px] sm:max-w-none w-full sm:w-auto rounded-full font-semibold transition-all text-sm sm:text-base px-4 py-2 sm:px-6 ${
                  isFollowingUser
                    ? 'bg-muted hover:bg-red-500/10 hover:border hover:border-red-500 text-foreground hover:text-red-500'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
              >
                {isFollowLoading ? '...' : isFollowingUser ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="max-w-[180px] sm:max-w-none w-full sm:w-auto bg-muted hover:bg-yellow-500/10 rounded-full font-semibold transition-colors text-foreground hover:text-yellow-500 flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-4"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
              <button
                onClick={async () => {
                  try {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/profile/${profile.username}` : `/profile/${profile.username}`
                    if (navigator.share) {
                      await navigator.share({ title: profile.full_name || profile.username, text: `Check out ${profile.full_name || profile.username} on BeBusy`, url })
                    } else if (navigator.clipboard) {
                      await navigator.clipboard.writeText(url)
                      toast.success('Profile link copied to clipboard')
                    } else {
                      window.prompt('Copy this link', url)
                    }
                  } catch (err) {
                    console.error('Share failed', err)
                    toast.error('Share failed')
                  }
                }}
                className="max-w-[180px] sm:max-w-none w-full sm:w-auto bg-muted rounded-full font-semibold transition-colors text-foreground flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-4"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          )}
        </div>

        {/* Name & Username */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.role && (
            <p className="text-sm text-[#10B981] mt-1">{profile.role}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mb-3 text-foreground whitespace-pre-wrap">{profile.bio}</p>
        )}

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.tags.map((tag: string) => {
              const cat = categorizeTag(tag)
              const cls = badgeClassForCategory(cat)
              return (
                <span key={tag} className={`text-xs rounded-full px-3 py-1 ${cls}`}>{tag.replace(/_/g, ' ')}</span>
              )
            })}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-muted-foreground text-sm mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          {profile.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4" />
              {(() => {
                const url = profile.website?.startsWith('http') ? profile.website : `https://${profile.website}`
                const display = profile.website?.replace(/^https?:\/\//, '')
                return (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                    {display}
                  </a>
                )
              })()}
            </div>
          )}
        </div>

        {/* Follow Stats */}
        <div className="flex flex-wrap gap-4 text-sm items-center">
          <button className="hover:underline" onClick={() => setActiveTab('following')}>
            <span className="font-bold text-foreground">{followingCount}</span>
            <span className="text-muted-foreground"> Following</span>
          </button>
          <button className="hover:underline" onClick={() => setActiveTab('followers')}>
            <span className="font-bold text-foreground">{followersCount}</span>
            <span className="text-muted-foreground"> Followers</span>
          </button>
          {userStreak && userStreak.current_streak > 0 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 rounded-full shadow-sm hover:shadow transition-shadow" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}>
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{userStreak.current_streak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          )}
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
              : 'text-muted-foreground bg-card hover:bg-muted'
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
              : 'text-muted-foreground bg-card hover:bg-muted'
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
              : 'text-muted-foreground bg-card hover:bg-muted'
          }`}
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Heart className="w-4 h-4" />
          Likes
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'portfolio'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : 'text-muted-foreground bg-card hover:bg-muted'
          }`}
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Briefcase className="w-4 h-4" />
          Portfolio
        </button>
      </div>

      {/* Posts */}
      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No posts yet</h3>
            <p className="text-muted-foreground">
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
            <h3 className="text-xl font-semibold mb-2 text-foreground">No media yet</h3>
            <p className="text-muted-foreground">
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
            <h3 className="text-xl font-semibold mb-2 text-foreground">No liked posts</h3>
            <p className="text-muted-foreground">
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

      {/* Portfolio */}
      {activeTab === 'portfolio' && (
        <div>
          {featuredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Featured Projects</h3>
              <p className="text-muted-foreground mb-6">
                {isOwnProfile ? "Add projects to your portfolio and feature them to showcase here" : `${profile.full_name || profile.username} hasn't featured any projects yet`}
              </p>
              <Link
                href={`/portfolio/${username}`}
                className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-full transition-colors"
                style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '12px', paddingBottom: '12px' }}
              >
                <Briefcase className="w-4 h-4" />
                {isOwnProfile ? "Manage Portfolio" : "View All Projects"}
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-6">
                {featuredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-[20px] border overflow-hidden transition-all hover:shadow-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', padding: '0' }}
                  >
                    <div style={{ padding: '28px' }}>
                      {/* Featured Badge */}
                      <div className="inline-flex items-center gap-2 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 12px' }}>
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>

                      {/* Project Info */}
                      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {project.title}
                      </h3>
                      
                      {project.description && (
                        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                          {project.description}
                        </p>
                      )}

                      {/* Technologies */}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                          {project.technologies.map((tech: string, index: number) => (
                            <span
                              key={index}
                              className="text-xs rounded-full bg-[rgba(255,255,255,0.04)] text-muted-foreground"
                              style={{ padding: '6px 12px', backdropFilter: 'blur(4px)' }}
                            >
                              {tech.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Completed Date */}
                      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                        Completed {new Date(project.completed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>

                      {/* View Project Link */}
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full shadow-lg"
                          style={{ padding: '12px 22px' }}
                        >
                          <LinkIcon className="w-4 h-4" />
                          View Project
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Link */}
              <div className="mt-6 text-center">
                <Link
                  href={`/portfolio/${username}`}
                  className="inline-flex items-center gap-2 text-[#10B981] hover:text-[#059669] font-semibold transition-colors"
                >
                  View Full Portfolio
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Followers */}
      {activeTab === 'followers' && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveTab('posts')}
        >
          <div
            className="bg-card rounded-[20px] border border-border w-full max-w-[320px] sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border" style={{ padding: '20px 24px' }}>
              <div>
                <h3 className="text-xl font-bold text-foreground">Followers</h3>
                <p className="text-sm text-muted-foreground" style={{ marginTop: '2px' }}>
                  {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('posts')}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {loadingFollowers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto" style={{ marginBottom: '12px' }} />
                  <p className="text-muted-foreground">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {followers.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 hover:bg-muted rounded-xl transition-colors"
                      style={{ padding: '12px' }}
                      onClick={() => setActiveTab('posts')}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-border">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate" style={{ marginTop: '2px' }}>
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
            className="bg-card rounded-[20px] border border-border w-full max-w-[320px] sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border" style={{ padding: '20px 24px' }}>
              <div>
                <h3 className="text-xl font-bold text-foreground">Following</h3>
                <p className="text-sm text-muted-foreground" style={{ marginTop: '2px' }}>
                  {following.length} {following.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('posts')}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {loadingFollowing ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto" style={{ marginBottom: '12px' }} />
                  <p className="text-muted-foreground">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {following.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 hover:bg-muted rounded-xl transition-colors"
                      style={{ padding: '12px' }}
                      onClick={() => setActiveTab('posts')}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-border">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate" style={{ marginTop: '2px' }}>
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
            className="bg-card rounded-[20px] border border-border max-w-md w-full"
            style={{ padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Report User</h3>
              </div>

              <p className="text-muted-foreground text-sm" style={{ marginBottom: '20px' }}>
                Help us understand what's wrong with this user.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label className="block text-sm font-medium text-foreground" style={{ marginBottom: '8px' }}>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-4 py-3 bg-muted border border-accent rounded-xl text-foreground focus:outline-none focus:border-green-500"
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
                <label className="block text-sm font-medium text-foreground" style={{ marginBottom: '8px' }}>
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please explain why you're reporting this..."
                  rows={3}
                  className="w-full px-4 py-3 bg-muted border border-accent rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={isReporting}
                  className="flex-1 px-8 py-4 bg-muted hover:bg-accent text-foreground font-semibold rounded-full transition-colors disabled:opacity-50 text-base"
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
