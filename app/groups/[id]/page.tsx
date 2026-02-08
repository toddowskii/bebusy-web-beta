'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGroup, isMember, joinGroup, leaveGroup, getGroupPosts, getGroupMembers } from '@/lib/supabase/groups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { PostCard } from '@/components/PostCard'
import { ArrowLeft, Users, Settings, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMemberOfGroup, setIsMemberOfGroup] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      setCurrentUser(currentProfile)

      const groupData = await getGroup(groupId)
      
      if (!groupData) {
        setLoading(false)
        toast.error('Group not found')
        router.push('/groups')
        return
      }
      
      setGroup(groupData as any)

      const memberStatus = await isMember(groupId)
      setIsMemberOfGroup(memberStatus)

      // Load posts
      const postsData = await getGroupPosts(groupId)
      setPosts(postsData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading group:', error)
      toast.error('Failed to load group')
      setLoading(false)
      router.push('/groups')
    }
  }

  const handleShowMembers = async () => {
    setShowMembersModal(true)
    setLoadingMembers(true)
    try {
      const membersData = await getGroupMembers(groupId)
      setMembers(membersData)
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleJoinLeave = async () => {
    if (!currentUser) return

    setIsJoining(true)
    try {
      if (isMemberOfGroup) {
        await leaveGroup(groupId)
        setIsMemberOfGroup(false)
        toast.success('Left group')
      } else {
        await joinGroup(groupId)
        setIsMemberOfGroup(true)
        toast.success('Joined group!')
        // Reload posts after joining
        const postsData = await getGroupPosts(groupId)
        setPosts(postsData)
      }
      // Update member count
      const groupData = await getGroup(groupId)
      setGroup(groupData)
    } catch (error) {
      console.error('Error toggling membership:', error)
      toast.error('Failed to update membership')
    } finally {
      setIsJoining(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!group) return null

  const isCreator = currentUser?.id === group.created_by

  return (
    <AppLayout username={currentUser?.username}>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="p-2 rounded-full transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{group.group_members?.length || 0} members</p>
        </div>
      </div>

      {/* Group Header Card */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {/* Cover/Banner */}
        <div className="h-32 bg-gradient-to-r from-green-500/20 to-emerald-600/20 relative"></div>
        
        {/* Group Info */}
        <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '20px' }}>
          {/* Icon & Action */}
          <div className="flex justify-between items-start -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 ring-2 shadow-lg" style={{ borderColor: 'var(--bg-secondary)' }}>
              <Users className="w-12 h-12 text-white" />
            </div>

            {/* Action Button */}
            {isCreator ? (
              <Link
                href={`/groups/${groupId}/edit`}
                className="mt-3 rounded-full font-semibold transition-colors flex items-center gap-2"
                style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <Settings className="w-4 h-4" />
                Edit Group
              </Link>
            ) : (
              <button
                onClick={handleJoinLeave}
                disabled={isJoining}
                className={`mt-3 rounded-full font-semibold transition-all ${
                  isMemberOfGroup
                    ? 'hover:bg-red-500/10 hover:border hover:border-red-500 hover:text-red-500'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
                style={isMemberOfGroup ? { paddingLeft: '24px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : { paddingLeft: '24px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px' }}
              >
                {isJoining ? '...' : isMemberOfGroup ? 'Leave' : 'Join'}
              </button>
            )}
          </div>

          {/* Name & Description */}
          <div className="mb-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {(group.tags || []).map((t: string) => (
                <span key={t} className="px-3 py-1 rounded-full text-sm bg-gray-700">{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <p className="mb-3 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{group.description}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <button 
              onClick={handleShowMembers}
              className="flex items-center gap-1.5 hover:text-[#10B981] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>{group.group_members?.length || 0} members</span>
            </button>
            <span>·</span>
            <span>Created by @{group.profiles?.username}</span>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div>
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No posts yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {isMemberOfGroup ? "Be the first to post in this group!" : "Join the group to see posts"}
            </p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="rounded-[20px] border max-w-md w-full max-h-[85vh] flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b" style={{ padding: '20px 24px', borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Members</h3>
                <p className="text-sm" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {loadingMembers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 mx-auto" style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No members found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {members.map((member: any) => (
                    <Link
                      key={member.id}
                      href={`/profile/${member.profiles?.username}`}
                      onClick={() => setShowMembersModal(false)}
                      className="flex items-center gap-3 rounded-xl transition-colors"
                      style={{ padding: '12px', backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {member.profiles?.avatar_url ? (
                        <img
                          src={member.profiles.avatar_url}
                          alt={member.profiles.username}
                          className="w-14 h-14 rounded-full object-cover ring-2"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2">
                          {member.profiles?.username?.[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {member.profiles?.full_name || member.profiles?.username}
                          </p>
                          {member.user_id === group.created_by && (
                            <span className="text-xs bg-[#10B981]/20 text-[#10B981] rounded-full flex-shrink-0" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}>
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-sm truncate" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                          @{member.profiles?.username}
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
    </AppLayout>
  )
}
