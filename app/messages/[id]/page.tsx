'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getMessages, sendMessage, uploadMessageFile, markMessagesAsRead } from '@/lib/supabase/messages'
import { ArrowLeft, Send, Paperclip, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChat()

    // Mark messages as read when opening the conversation
    markMessagesAsRead(conversationId)

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
              )
            `)
            .eq('id', (payload.new as any).id)
            .single()

          if (data) {
            setMessages((prev) => {
              // Check if message already exists to avoid duplicates
              if (prev.some((m: any) => m.id === (data as any).id)) {
                return prev
              }
              return [...prev, data as any]
            })
          }
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

    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      content: messageContent,
      sender_id: currentUser.id,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      profiles: currentUser
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const sentMessage = await sendMessage(conversationId, messageContent, null, null, null)
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
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!otherUser) return null

  return (
    <div className="h-screen bg-[#000000] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-[#000000]/95 backdrop-blur-md border-b border-[#2C2C2E] z-10 flex items-center" style={{ padding: '20px', gap: '16px' }}>
        <button onClick={() => router.back()} className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors">
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
            <h2 className="font-bold text-[#FFFFFF]">{otherUser.full_name || otherUser.username}</h2>
            <p className="text-sm text-[#9BA1A6]">@{otherUser.username}</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#9BA1A6]">No messages yet. Say hi! 👋</p>
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
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-[16px] overflow-hidden ${
                        isOwn
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-[#1C1C1E] text-white border border-[#2C2C2E]'
                      }`}
                      style={{ padding: hasFile && !message.content ? '0' : '12px 16px' }}
                    >
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
            className="bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white rounded-full transition-colors border border-[#2C2C2E] disabled:opacity-50"
            style={{ padding: '12px' }}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? "Uploading file..." : "Type a message..."}
            className="flex-1 bg-[#1C1C1E] text-white rounded-full outline-none focus:ring-2 focus:ring-[#10B981] border border-[#2C2C2E]"
            style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}
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
    </div>
  )
}
