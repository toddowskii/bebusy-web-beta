'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getGroupPosts } from '@/lib/supabase/groups'
import { createPost } from '@/lib/supabase/posts'
import { ArrowLeft, Send, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadGroupChat()

    // Subscribe to new posts in this group
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setPosts((prev) => {
              // Check if post already exists to avoid duplicates
              if (prev.some(p => p.id === data.id)) {
                return prev
              }
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    scrollToBottom()
  }, [posts])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadGroupChat = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      setCurrentUser(currentProfile)

      if (!currentProfile) {
        toast.error('Please log in')
        router.push('/login')
        return
      }

      // Get group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (!groupData) {
        toast.error('Group not found')
        router.push('/messages')
        return
      }

      setGroup(groupData)

      // Check if user is a member
      const { data: membership } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', currentProfile.id)
        .single()

      if (!membership) {
        toast.error('You are not a member of this group')
        router.push('/messages')
        return
      }

      // Load posts
      const groupPosts = await getGroupPosts(groupId)
      setPosts(groupPosts)
    } catch (error) {
      console.error('Error loading group chat:', error)
      toast.error('Failed to load group chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const result = await createPost(messageContent, null, groupId)
      if (result.data) {
        // Add the message instantly to the UI
        setPosts(prev => [...prev, { ...result.data, profiles: currentUser }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="h-screen bg-[#000000] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-[#000000]/95 backdrop-blur-md border-b border-[#2C2C2E] z-10 flex items-center" style={{ padding: '20px', gap: '16px' }}>
        <button onClick={() => router.back()} className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center flex-1" style={{ gap: '12px' }}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[#FFFFFF]">{group.name}</h2>
            <p className="text-sm text-[#9BA1A6]">{group.members_count} members</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#9BA1A6]">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => {
              const isOwn = post.user_id === currentUser.id
              return (
                <div
                  key={`${post.id}-${index}`}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center mb-1" style={{ gap: '8px' }}>
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            {post.profiles?.username[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-[#ECEDEE]">
                          {post.profiles?.full_name || post.profiles?.username}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-[16px] ${
                        isOwn
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-[#1C1C1E] text-white border border-[#2C2C2E]'
                      }`}
                      style={{ padding: '12px 16px' }}
                    >
                      <p className="whitespace-pre-wrap break-words">{post.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-[#2C2C2E]" style={{ padding: '20px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#1C1C1E] text-white rounded-full outline-none focus:ring-2 focus:ring-[#10B981] border border-[#2C2C2E]"
            style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg"
            style={{ padding: '12px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
