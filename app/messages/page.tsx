'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getConversations, getUserGroupChats } from '@/lib/supabase/messages'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { MessageSquare, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [groupChats, setGroupChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const userProfile = await getCurrentProfile()
      setProfile(userProfile)
      
      const [convos, groups] = await Promise.all([
        getConversations(),
        getUserGroupChats()
      ])
      setConversations(convos)
      setGroupChats(groups)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
      <h2 className="text-2xl font-bold text-[#ECEDEE]" style={{ marginBottom: '24px' }}>Messages</h2>

      {/* Tabs */}
      <div className="flex border-b border-[#2C2C2E]" style={{ gap: '32px', marginBottom: '32px' }}>
        <button
          onClick={() => setActiveTab('all')}
          className="font-semibold transition-colors"
          style={{
            paddingBottom: '12px',
            color: activeTab === 'all' ? '#10B981' : '#9BA1A6',
            borderBottom: activeTab === 'all' ? '2px solid #10B981' : '2px solid transparent',
          }}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className="font-semibold transition-colors"
          style={{
            paddingBottom: '12px',
            color: activeTab === 'direct' ? '#10B981' : '#9BA1A6',
            borderBottom: activeTab === 'direct' ? '2px solid #10B981' : '2px solid transparent',
          }}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className="font-semibold transition-colors"
          style={{
            paddingBottom: '12px',
            color: activeTab === 'groups' ? '#10B981' : '#9BA1A6',
            borderBottom: activeTab === 'groups' ? '2px solid #10B981' : '2px solid transparent',
          }}
        >
          Groups
        </button>
      </div>

      {/* Messages List */}
      {(() => {
        const allMessages = [
          ...conversations.map(c => ({ ...c, type: 'direct' })),
          ...groupChats.map(g => ({ ...g, type: 'group' }))
        ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        const filteredMessages = activeTab === 'all' 
          ? allMessages 
          : activeTab === 'direct' 
            ? allMessages.filter(m => m.type === 'direct')
            : allMessages.filter(m => m.type === 'group');

        if (filteredMessages.length === 0) {
          return (
            <div className="p-12 text-center relative">
              <MessageSquare className="w-80 h-80 text-[#2D2D2D] mx-auto mb-4 absolute left-1/2 -translate-x-1/2" style={{ top: '80px', zIndex: 0 }} />
              <h3 className="text-xl font-semibold mb-2 text-[#ECEDEE] relative" style={{ zIndex: 10 }}>
                {activeTab === 'groups' ? 'No group chats yet' : 'No messages yet'}
              </h3>
              <p className="text-[#9BA1A6] relative" style={{ zIndex: 10 }}>
                {activeTab === 'groups' 
                  ? 'Join a group to start chatting!' 
                  : 'Start a conversation by visiting someone\'s profile!'}
              </p>
            </div>
          );
        }

        return (
          <div>
            {filteredMessages.map((item) => (
              <Link
                key={item.id}
                href={item.type === 'group' ? `/messages/group/${item.id}` : `/messages/${item.id}`}
                className="block"
                style={{ marginBottom: '16px' }}
              >
                <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] hover:bg-[#252527] transition-all cursor-pointer" style={{ padding: '20px' }}>
                  <div className="flex items-center" style={{ gap: '16px' }}>
                    {item.type === 'group' ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    ) : item.otherUser?.avatar_url ? (
                      <img
                        src={item.otherUser.avatar_url}
                        alt={item.otherUser.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                        {item.otherUser?.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                        <h3 className="font-bold truncate text-[#FFFFFF]">
                          {item.type === 'group' 
                            ? item.name 
                            : (item.otherUser?.full_name || item.otherUser?.username)}
                        </h3>
                        {item.lastMessage && (
                          <span className="text-sm text-[#8E8E93]">
                            {formatTime(item.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[#9BA1A6] text-sm truncate">
                        {(() => {
                          if (!item.lastMessage) return 'No messages yet';
                          if (item.lastMessage.content) return item.lastMessage.content;
                          if (item.lastMessage.file_url) {
                            if (item.lastMessage.file_type?.startsWith('image/')) return '📷 Image';
                            if (item.lastMessage.file_type?.startsWith('video/')) return '🎥 Video';
                            if (item.lastMessage.file_type === 'application/pdf') return '📄 PDF';
                            return '📎 File';
                          }
                          return 'No messages yet';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}
    </AppLayout>
  )
}
