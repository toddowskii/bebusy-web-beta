'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getMessages, sendMessage, uploadMessageFile, markMessagesAsRead, deleteMessage } from '@/lib/supabase/messages'
import { ArrowLeft, Send, Paperclip, Download, FileText, Reply, Trash2, X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createReport, type ReportReason } from '@/lib/supabase/reports'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [reportingMessage, setReportingMessage] = useState<any>(null)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChat()

    // Mark messages as read when opening the conversation (don't block on errors)
    markMessagesAsRead(conversationId).catch(err => {
      console.error('Error marking messages as read:', err)
    })

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
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
              // Remove any temporary message from the same sender with similar content
              const filtered = prev.filter(m => {
                if (m.id.toString().startsWith('temp-') && 
                    m.sender_id === (data as any).sender_id &&
                    m.content === (data as any).content) {
                  return false
                }
                return true
              })
              
              // Check if the real message already exists
              if (filtered.some((m: any) => m.id === (data as any).id)) {
                return filtered
              }
              
              return [...filtered, data as any]
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
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => prev.filter(m => m.id !== (payload.old as any).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChat = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      setCurrentUser(currentProfile)

      // Get conversation details
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user1_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          user2:user2_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', conversationId)
        .single()

      if (!conversation) {
        toast.error('Conversation not found')
        router.push('/messages')
        return
      }

      const other = (conversation as any).user1_id === currentProfile?.id ? (conversation as any).user2 : (conversation as any).user1
      setOtherUser(other)

      // Load messages
      const messagesData = await getMessages(conversationId)
      setMessages(messagesData)
    } catch (error) {
      console.error('Error loading chat:', error)
      toast.error('Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !currentUser) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')
    const parentId = replyingTo?.id || null
    const parentData = replyingTo ? {
      id: replyingTo.id,
      content: replyingTo.content,
      sender_id: replyingTo.sender_id,
      profiles: replyingTo.profiles
    } : null
    setReplyingTo(null)

    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      content: messageContent,
      sender_id: currentUser.id,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      profiles: currentUser,
      parent_message: parentData
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const sentMessage = await sendMessage(conversationId, messageContent, null, null, null, parentId)
      if (!sentMessage) {
        throw new Error('No message returned from server')
      }
      // Replace optimistic message with real one
      setMessages((prev) => 
        prev.map(msg => msg.id === optimisticMessage.id ? sentMessage : msg)
      )
    } catch (error: any) {
      console.error('Error sending message:', error)
      const errorMessage = error?.message || 'Failed to send message'
      toast.error(errorMessage)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id))
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const { url, type, name } = await uploadMessageFile(file, conversationId)

      // Send message with file attachment
      const sentMessage = await sendMessage(conversationId, null, url, type, name)
      
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage])
        toast.success('File sent successfully')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!otherUser) return null

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-md z-10 flex items-center" style={{ padding: '20px', gap: '16px', backgroundColor: 'var(--bg-primary)', opacity: 0.95, borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-full transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href={`/profile/${otherUser.username}`} className="flex items-center flex-1" style={{ gap: '12px' }}>
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#2C2C2E]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold ring-2 ring-[#2C2C2E]">
              {otherUser.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{otherUser.full_name || otherUser.username}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{otherUser.username}</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px', paddingBottom: '140px' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-muted)' }}>No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id
              const hasFile = message.file_url
              const isImage = message.file_type?.startsWith('image/')
              const isVideo = message.file_type?.startsWith('video/')
              const isPDF = message.file_type === 'application/pdf'
              
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-[16px] overflow-hidden ${
                        isOwn
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : ''
                      }`}
                      style={{ padding: hasFile && !message.content ? '0' : '12px 16px' }}
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
                      {/* File attachment */}
                      {hasFile && (
                        <div className={message.content ? 'mb-2' : ''}>
                          {isImage && (
                            <img 
                              src={message.file_url} 
                              alt={message.file_name || 'Image'}
                              className="w-full max-w-[280px] h-[280px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.file_url, '_blank')}
                            />
                          )}
                          {isVideo && (
                            <video 
                              src={message.file_url} 
                              controls 
                              className="w-full max-w-[280px] h-[280px] object-cover rounded-lg"
                            />
                          )}
                          {isPDF && (
                            <a 
                              href={message.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                            >
                              <FileText className="w-5 h-5" />
                              <span className="flex-1 text-sm truncate">{message.file_name || 'Document.pdf'}</span>
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {!isImage && !isVideo && !isPDF && (
                            <a 
                              href={message.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                            >
                              <Paperclip className="w-5 h-5" />
                              <span className="flex-1 text-sm truncate">{message.file_name || 'File'}</span>
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                      {/* Text content */}
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="text-xs hover:text-[#10B981] flex items-center gap-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                      {!isOwn && (
                        <button
                          onClick={() => setReportingMessage(message)}
                          className="text-xs hover:text-yellow-500 flex items-center gap-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-xs hover:text-red-500 flex items-center gap-1"
                          style={{ color: 'var(--text-muted)' }}
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

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-[#2C2C2E] sticky bottom-0 z-10" style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', backgroundColor: 'var(--bg-primary)' }}>
        {replyingTo && (
          <div className="mb-3 rounded-lg p-3 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="w-4 h-4 text-[#10B981]" />
                  <span className="text-sm text-[#10B981] font-semibold">
                    Replying to {replyingTo.profiles?.username}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{replyingTo.content || 'Attachment'}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="hover:text-white ml-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center" style={{ gap: '12px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />
          <button
            type="button"
            onClick={handleFileClick}
            disabled={uploading || sending}
            className="rounded-full transition-colors border disabled:opacity-50"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={() => setTimeout(() => scrollToBottom(), 120)}
            placeholder={uploading ? "Uploading file..." : replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1 text-white rounded-full outline-none focus:ring-2 focus:ring-[#10B981] border"
            style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            disabled={sending || uploading}
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
            className="rounded-[20px] border max-w-md w-full"
            style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Message</h3>
              </div>

              <p className="text-sm" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                Help us understand what's wrong with this message.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
                <label className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more context..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500 resize-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReportingMessage(null)}
                  disabled={isReporting}
                  className="flex-1 px-6 py-3 hover:bg-[#3C3C3E] font-semibold rounded-full transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
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
