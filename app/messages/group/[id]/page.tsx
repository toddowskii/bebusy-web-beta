'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getGroupMessages, sendGroupMessage, markGroupMessagesAsRead, deleteMessage } from '@/lib/supabase/messages'
import { getGroup } from '@/lib/supabase/groups'
import { ArrowLeft, Send, Users, Reply, Trash2, X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createReport, type ReportReason } from '@/lib/supabase/reports'

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [reportingMessage, setReportingMessage] = useState<any>(null)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadGroupChat()

    // Subscribe to new messages
    const channel = supabase
      .channel(`group-messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profiles:sender_id (
                id,
                username,
                full_name,
                avatar_url
              ),
              parent_message:parent_message_id (
                id,
                content,
                sender_id,
                profiles:sender_id (
                  username
                )
              )
            `)
            .eq('id', (payload.new as any).id)
            .single()

          if (data) {
            setMessages((prev) => {
              if (prev.some((m: any) => m.id === (data as any).id)) {
                return prev
              }
              return [...prev, data as any]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          setMessages((prev) => prev.filter(m => m.id !== (payload.old as any).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      // Get the focus group by group_id
      const { data: focusGroupData, error: focusGroupError } = await supabase
        .from('focus_groups')
        .select('*')
        .eq('group_id', groupId)
        .single()

      if (focusGroupError || !focusGroupData) {
        toast.error('Focus group not found')
        router.push('/messages')
        return
      }

      // Also get the group details
      const groupData = await getGroup(groupId)
      
      if (!groupData) {
        toast.error('Group not found')
        router.push('/messages')
        return
      }
      
      setGroup(groupData)

      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', currentProfile.id)
        .single()

      if (membershipError || !membership) {
        toast.error('You are not a member of this group')
        router.push('/messages')
        return
      }

      const groupMessages = await getGroupMessages(groupId)
      setMessages(groupMessages)

      // Mark messages as read (don't block on errors)
      markGroupMessagesAsRead(groupId).catch(err => {
        console.error('Error marking messages as read:', err)
      })
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
    const parentId = replyingTo?.id || null
    setReplyingTo(null)

    try {
      await sendGroupMessage(groupId, messageContent, null, null, null, parentId)
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error?.message || 'Failed to send message')
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
      toast.success('Message deleted')
    } catch (error: any) {
      console.error('Error deleting message:', error)
      toast.error(error?.message || 'Failed to delete message')
    }
  }

  const handleReportMessage = async () => {
    if (isReporting || !reportingMessage) return

    setIsReporting(true)
    try {
      const result = await createReport({
        reported_user_id: reportingMessage.sender_id,
        content_type: 'message',
        content_id: reportingMessage.id,
        reason: reportReason,
        description: reportDescription || undefined
      })

      if (result.error) throw new Error(result.error)

      toast.success('Report submitted')
      setReportingMessage(null)
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
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="h-screen bg-background text-white flex flex-col">
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10 flex items-center" style={{ padding: '20px', gap: '16px' }}>
        <button onClick={() => router.back()} className="p-2 hover:bg-card rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center flex-1" style={{ gap: '12px' }}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{group.name}</h2>
            <p className="text-sm text-muted-foreground">{group.members_count} members</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center mb-1" style={{ gap: '8px' }}>
                        {message.profiles?.avatar_url ? (
                          <img
                            src={message.profiles.avatar_url}
                            alt={message.profiles.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            {message.profiles?.username[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {message.profiles?.full_name || message.profiles?.username}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-[16px] ${
                        isOwn
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-card text-white border border-border'
                      }`}
                      style={{ padding: '12px 16px' }}
                    >
                      {message.parent_message && (
                        <div className="mb-2 pb-2 border-b border-white/20">
                          <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                            <Reply className="w-3 h-3" />
                            <span>{message.parent_message.profiles?.username}</span>
                          </div>
                          <p className="text-sm opacity-80 truncate">{message.parent_message.content}</p>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                      {!isOwn && (
                        <button
                          onClick={() => setReportingMessage(message)}
                          className="text-xs text-muted-foreground hover:text-yellow-500 flex items-center gap-1"
                        >
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-border" style={{ padding: '20px' }}>
        {replyingTo && (
          <div className="mb-3 bg-card rounded-lg p-3 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-semibold">
                    Replying to {replyingTo.profiles?.username}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-muted-foreground hover:text-white ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center" style={{ gap: '12px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1 bg-card text-white rounded-full outline-none focus:ring-2 focus:ring-primary border border-border"
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

      {reportingMessage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setReportingMessage(null)}
        >
          <div
            className="bg-card rounded-[20px] border border-border max-w-md w-full"
            style={{ padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Report Message</h3>
              </div>

              <p className="text-muted-foreground text-sm" style={{ marginBottom: '20px' }}>
                Help us understand what's wrong with this message.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label className="block text-sm font-medium text-foreground" style={{ marginBottom: '8px' }}>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:border-green-500"
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
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more context..."
                  rows={3}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReportingMessage(null)}
                  disabled={isReporting}
                  className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportMessage}
                  disabled={isReporting}
                  className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-full transition-colors disabled:opacity-50"
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
