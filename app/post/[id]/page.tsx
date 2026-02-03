'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getComments, createComment, deleteComment } from '@/lib/supabase/comments'
import { likePost, unlikePost } from '@/lib/supabase/posts'
import { ArrowLeft, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      setCurrentUser(currentProfile)

      // Fetch post
      const { data: postData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          likes (
            id,
            user_id
          )
        `)
        .eq('id', postId)
        .single()

      if (error || !postData) {
        toast.error('Post not found')
        router.push('/')
        return
      }

      setPost(postData as any)
      setLikeCount((postData as any).likes.length)
      setIsLiked((postData as any).likes?.some((like: any) => like.user_id === currentProfile?.id) || false)

      // Fetch comments
      const commentsData = await getComments(postId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading post:', error)
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser) return

    const previousState = { isLiked, likeCount }
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      if (isLiked) {
        await unlikePost(postId)
      } else {
        await likePost(postId)
      }
    } catch (error) {
      setIsLiked(previousState.isLiked)
      setLikeCount(previousState.likeCount)
      toast.error('Failed to update like')
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    setSubmitting(true)
    try {
      const comment = await createComment(postId, newComment.trim())
      setComments([...comments, comment])
      setNewComment('')
      toast.success('Comment added!')
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#000000] border-b border-[#2D2D2D] z-50">
        <div className="h-14 flex items-center gap-4" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <button onClick={() => router.back()} className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#9BA1A6]" />
          </button>
          <h2 className="text-xl font-bold text-[#ECEDEE]">Post</h2>
        </div>
      </header>

      <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
        {/* Post Card */}
        <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] shadow-sm" style={{ marginBottom: '20px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '28px', paddingBottom: '28px' }}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <Link href={`/profile/${post.profiles.username}`}>
              {post.profiles.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  {post.profiles.username[0].toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href={`/profile/${post.profiles.username}`} className="font-bold text-[#FFFFFF] truncate text-base hover:underline">
                  {post.profiles.full_name || post.profiles.username}
                </Link>
              </div>
              <Link href={`/profile/${post.profiles.username}`} className="text-sm text-[#8E8E93] hover:underline">
                @{post.profiles.username}
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-[#FFFFFF] text-base whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={post.image_url} alt="Post image" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[#8E8E93] text-sm" style={{ marginBottom: '12px' }}>{formatDate(post.created_at)}</p>

          {/* Stats */}
          <div className="flex items-center gap-6 border-y border-[#2C2C2E]" style={{ paddingTop: '12px', paddingBottom: '12px', marginBottom: '12px' }}>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF]">{likeCount}</span>
              <span className="text-[#8E8E93] text-sm">Likes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF]">{comments.length}</span>
              <span className="text-[#8E8E93] text-sm">Comments</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6" style={{ paddingTop: '4px' }}>
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-[#8E8E93] hover:text-red-500 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button className="flex items-center gap-2 text-[#8E8E93] hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 text-[#8E8E93] hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comment Form */}
        {currentUser && (
          <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] shadow-sm" style={{ marginBottom: '20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '24px' }}>
            <form onSubmit={handleSubmitComment}>
              <div className="flex gap-3">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    placeholder="Post your reply"
                    className="w-full bg-transparent text-[#FFFFFF] placeholder-[#8E8E93] outline-none resize-none leading-relaxed text-[15px]"
                    rows={1}
                    disabled={submitting}
                    style={{ minHeight: '24px', maxHeight: '200px', overflow: 'auto' }}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !newComment.trim() ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !submitting && newComment.trim() && (e.currentTarget.style.backgroundColor = '#0ea472')}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                >
                  {submitting ? 'Replying...' : 'Reply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Comments */}
        <div>
          {comments.length === 0 ? (
            <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] shadow-sm" style={{ paddingTop: '80px', paddingBottom: '80px', paddingLeft: '40px', paddingRight: '40px' }}>
              <div className="flex flex-col items-center justify-center">
                <MessageCircle className="w-24 h-24 text-[#8E8E93] mb-6 opacity-25" />
                <p className="text-[#8E8E93] text-lg">No comments yet. Be the first to reply!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] shadow-sm hover:bg-[#252527] transition-all" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
                  <div className="flex gap-3">
                    <Link href={`/profile/${comment.profiles.username}`}>
                      {comment.profiles.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {comment.profiles.username[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${comment.profiles.username}`} className="font-bold text-[#FFFFFF] hover:underline">
                          {comment.profiles.full_name || comment.profiles.username}
                        </Link>
                        <Link href={`/profile/${comment.profiles.username}`} className="text-[#8E8E93] text-sm hover:underline">
                          @{comment.profiles.username}
                        </Link>
                        <span className="text-[#8E8E93]">·</span>
                        <span className="text-[#8E8E93] text-sm">
                          {formatDate(comment.created_at)}
                        </span>
                        {currentUser?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto p-1.5 text-[#8E8E93] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[#FFFFFF] whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
