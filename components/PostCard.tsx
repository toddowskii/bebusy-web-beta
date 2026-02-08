'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Trash2, AlertTriangle, Flag } from 'lucide-react'
import { likePost, unlikePost, deletePost } from '@/lib/supabase/posts'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { createReport, type ReportReason } from '@/lib/supabase/reports'

interface PostCardProps {
  post: {
    id: string
    content: string
    image_url?: string
    created_at: string
    user_id: string
    profiles?: {
      username?: string
      avatar_url?: string
      full_name?: string
      role?: string
    } | null
    likes: Array<{ id: string }>
    comments: Array<{ id: string }>
    is_liked?: boolean
  }
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [isLiking, setIsLiking] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUserId(data.user?.id || null)
      
      // Fetch user's role
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        setCurrentUserRole((profile as any)?.role || null)
      }
    }
    getCurrentUser()
  }, [])

  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    const previousState = { isLiked, likeCount }
    
    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      if (isLiked) {
        await unlikePost(post.id)
      } else {
        await likePost(post.id)
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousState.isLiked)
      setLikeCount(previousState.likeCount)
      toast.error('Failed to update like')
      console.error(error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    
    setIsDeleting(true)
    try {
      const { error } = await deletePost(post.id)
      if (error) throw error
      
      toast.success('Post deleted')
      setShowDeleteModal(false)
      window.location.reload() // Refresh to update feed
    } catch (error) {
      toast.error('Failed to delete post')
      console.error(error)
      setIsDeleting(false)
    }
  }

  const handleReport = async () => {
    if (isReporting) return
    
    if (!reportDescription.trim()) {
      toast.error('Please provide a reason for your report')
      return
    }
    
    setIsReporting(true)
    try {
      const result = await createReport({
        reported_user_id: post.user_id,
        content_type: 'post',
        content_id: post.id,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <Link href={`/post/${post.id}`} className="block" style={{ marginBottom: '16px' }}>
        <div className="rounded-[20px] transition-all cursor-pointer shadow-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.username || 'User'}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                {post.profiles?.username?.[0].toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold truncate text-base" style={{ color: 'var(--text-primary)' }}>
                {post.profiles?.full_name || post.profiles?.username || 'Unknown User'}
              </span>
              {post.profiles?.role && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.profiles.role}</span>
                </>
              )}
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(post.created_at)}</span>
          </div>

          {(currentUserId === post.user_id || currentUserRole === 'admin') && (
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowDeleteModal(true)
              }}
              disabled={isDeleting}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {currentUserId && currentUserId !== post.user_id && (
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowReportModal(true)
              }}
              className="p-1.5 hover:bg-yellow-500/10 rounded-lg transition-all hover:text-yellow-500"
              style={{ color: 'var(--text-muted)' }}
              title="Report post"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-3" style={{ marginBottom: '12px' }}>
          <p className="whitespace-pre-wrap break-words leading-relaxed" style={{ color: 'var(--text-primary)' }}>{post.content}</p>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="mb-3 rounded-xl overflow-hidden" style={{ marginBottom: '12px' }}>
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-w-[500px] h-auto object-contain"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 border-t" style={{ borderColor: 'var(--border)', paddingTop: '12px', marginTop: '12px' }}>
          <button
            onClick={(e) => {
              e.preventDefault()
              handleLike()
            }}
            disabled={isLiking}
            className="flex items-center gap-2 hover:text-red-500 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments.length}</span>
          </button>

          <button className="flex items-center gap-2 hover:text-green-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments.length > 0 ? '2' : ''}</span>
          </button>
        </div>
      </div>
    </Link>

    {/* Delete Confirmation Modal - Outside Link to prevent navigation interference */}
    {showDeleteModal && (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowDeleteModal(false)
        }}
      >
        <div 
          className="rounded-[20px] max-w-sm w-full"
          style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', padding: '28px' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center" style={{ marginBottom: '20px' }}>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              Delete Post?
            </h3>
            
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              This action cannot be undone. Your post will be permanently deleted.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteModal(false)
                }}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 font-semibold rounded-full transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Report Modal */}
    {showReportModal && (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowReportModal(false)
        }}
      >
        <div 
          className="rounded-[20px] max-w-md w-full"
          style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', padding: '28px' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <Flag className="w-6 h-6" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Post</h3>
            </div>
            
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Help us understand what's wrong with this post.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-green-500"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
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
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                Additional Details <span className="text-red-500">*</span>
              </label>
              <style jsx>{`
                textarea::placeholder {
                  color: var(--text-muted);
                  opacity: 1;
                }
              `}</style>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please explain why you're reporting this..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-green-500 resize-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowReportModal(false)
                }}
                disabled={isReporting}
                className="flex-1 px-8 py-4 font-semibold rounded-full transition-colors disabled:opacity-50 text-base"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => !isReporting && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => !isReporting && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleReport()
                }}
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
  </>
  )
}

