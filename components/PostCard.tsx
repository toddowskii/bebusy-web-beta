'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Trash2, AlertTriangle } from 'lucide-react'
import { likePost, unlikePost, deletePost } from '@/lib/supabase/posts'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
        <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] hover:bg-[#252527] transition-all cursor-pointer shadow-sm" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
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
              <span className="font-bold text-[#FFFFFF] truncate text-base">
                {post.profiles?.full_name || post.profiles?.username || 'Unknown User'}
              </span>
              {post.profiles?.role && (
                <>
                  <span className="text-[#8E8E93]">·</span>
                  <span className="text-sm text-[#8E8E93]">{post.profiles.role}</span>
                </>
              )}
            </div>
            <span className="text-sm text-[#8E8E93]">{formatDate(post.created_at)}</span>
          </div>

          {(currentUserId === post.user_id || currentUserRole === 'admin') && (
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowDeleteModal(true)
              }}
              disabled={isDeleting}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-[#8E8E93] hover:text-red-500"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-3" style={{ marginBottom: '12px' }}>
          <p className="text-[#FFFFFF] whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="mb-3 rounded-xl overflow-hidden" style={{ marginBottom: '12px' }}>
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 border-t border-[#2C2C2E]" style={{ paddingTop: '12px', marginTop: '12px' }}>
          <button
            onClick={(e) => {
              e.preventDefault()
              handleLike()
            }}
            disabled={isLiking}
            className="flex items-center gap-2 text-[#8E8E93] hover:text-red-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button className="flex items-center gap-2 text-[#8E8E93] hover:text-blue-500 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments.length}</span>
          </button>

          <button className="flex items-center gap-2 text-[#8E8E93] hover:text-green-500 transition-colors">
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
          className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] max-w-sm w-full"
          style={{ padding: '28px' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center" style={{ marginBottom: '20px' }}>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-[#FFFFFF]" style={{ marginBottom: '8px' }}>
              Delete Post?
            </h3>
            
            <p className="text-[#9BA1A6] text-sm" style={{ marginBottom: '24px' }}>
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
                className="flex-1 px-6 py-3 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#FFFFFF] font-semibold rounded-full transition-colors disabled:opacity-50"
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
  </>
  )
}

