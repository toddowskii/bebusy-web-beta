'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGroup, isMember, joinGroup, leaveGroup, getGroupPosts } from '@/lib/supabase/groups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { PostCard } from '@/components/PostCard'
import { ArrowLeft, Users, Settings } from 'lucide-react'
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
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!group) return null

  const isCreator = currentUser?.id === group.created_by

  return (
    <AppLayout username={currentUser?.username}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="flex items-center text-[#9BA1A6] hover:text-[#FFFFFF] transition-colors" style={{ gap: '8px' }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Group Info */}
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ padding: '32px', marginBottom: '24px' }}>
        <div className="flex items-start" style={{ gap: '20px', marginBottom: '24px' }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
              <h1 className="text-2xl font-bold text-[#FFFFFF]">{group.name}</h1>
              {isCreator && (
                <button
                  onClick={() => router.push(`/groups/${groupId}/edit`)}
                  className="flex items-center border border-[#2C2C2E] rounded-[12px] hover:bg-[#252527] transition-colors text-[#FFFFFF]"
                  style={{ padding: '8px 16px', gap: '6px' }}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
              )}
            </div>
            <p className="text-sm text-[#9BA1A6]">{group.group_members.length} members</p>
          </div>
        </div>

        {group.description && (
          <p className="text-[#ECEDEE]" style={{ marginBottom: '24px' }}>{group.description}</p>
        )}

        <div className="flex items-center text-sm text-[#8E8E93]" style={{ gap: '8px', marginBottom: '24px' }}>
          <span>{group.group_members.length} members</span>
          <span>·</span>
          <span>Created by @{group.profiles.username}</span>
        </div>

        {!isCreator && (
          <button
            onClick={handleJoinLeave}
            disabled={isJoining}
            className={`w-full rounded-[12px] font-semibold transition-all ${
              isMemberOfGroup
                ? 'border border-[#2C2C2E] hover:bg-red-500/10 hover:border-red-500 hover:text-red-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700'
            }`}
            style={{ paddingTop: '14px', paddingBottom: '14px', boxShadow: isMemberOfGroup ? 'none' : '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
          >
            {isJoining ? '...' : isMemberOfGroup ? 'Leave Group' : 'Join Group'}
          </button>
        )}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-5xl" style={{ marginBottom: '16px' }}>📝</div>
          <h3 className="text-xl font-semibold text-[#ECEDEE]" style={{ marginBottom: '8px' }}>No posts yet</h3>
          <p className="text-[#9BA1A6]">Be the first to post in this group!</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
