'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getComments, createComment, deleteComment, updateComment, likeComment, unlikeComment } from '@/lib/supabase/comments'
import { likePost, unlikePost } from '@/lib/supabase/posts'
import { ArrowLeft, Heart, MessageCircle, Share2, Trash2, Reply, Edit2, X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createReport, type ReportReason } from '@/lib/supabase/reports'

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
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [editingComment, setEditingComment] = useState<any>(null)
  const [editContent, setEditContent] = useState('')
  const [reportingComment, setReportingComment] = useState<any>(null)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)

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
      const commentsWithLikes = (commentsData || []).map((comment: any) => {
        const likes = comment.comment_likes || []
        return {
          ...comment,
          likes_count: likes.length,
          is_liked: currentProfile?.id ? likes.some((like: any) => like.user_id === currentProfile.id) : false
        }
      })
      setComments(commentsWithLikes)
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
      setReplyingTo(null)
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

  const handleToggleCommentLike = async (comment: any) => {
    if (!currentUser || likingCommentId) return

    const isLiked = !!comment.is_liked
    setLikingCommentId(comment.id)

    setComments(prev => prev.map(c => {
      if (c.id !== comment.id) return c
      return {
        ...c,
        is_liked: !isLiked,
        likes_count: (c.likes_count || 0) + (isLiked ? -1 : 1)
      }
    }))

    try {
      if (isLiked) {
        await unlikeComment(comment.id)
      } else {
        await likeComment(comment.id)
      }
    } catch (error) {
      console.error('Error updating comment like:', error)
      toast.error('Failed to update like')
      setComments(prev => prev.map(c => {
        if (c.id !== comment.id) return c
        return {
          ...c,
          is_liked: isLiked,
          likes_count: (c.likes_count || 0) + (isLiked ? 1 : -1)
        }
      }))
    } finally {
      setLikingCommentId(null)
    }
  }

  const handleStartEdit = (comment: any) => {
    setEditingComment(comment)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingComment) return

    try {
      const updated: any = await updateComment(editingComment.id, editContent.trim())
      setComments(comments.map((c: any) => c.id === updated.id ? updated : c))
      setEditingComment(null)
      setEditContent('')
      toast.success('Comment updated!')
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleStartReply = (comment: any) => {
    setReplyingTo(comment)
    setNewComment(`@${comment.profiles.username} `)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setNewComment('')
  }

  const handleReportComment = async () => {
    if (isReporting || !reportingComment) return
    
    if (!reportDescription.trim()) {
      toast.error('Please provide a reason for your report')
      return
    }
    
    setIsReporting(true)
    try {
      const result = await createReport({
        reported_user_id: reportingComment.user_id,
        content_type: 'comment',
        content_id: reportingComment.id,
        reason: reportReason,
        description: reportDescription
      })

      if (result.error) throw new Error(result.error)
      
      toast.success('Report submitted')
      setReportingComment(null)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="h-14 flex items-center gap-4" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <button onClick={() => router.back()} className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-xl font-bold text-foreground">Post</h2>
        </div>
      </header>

      <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
        {/* Post Card */}
        <div className="bg-card rounded-[20px] border border-border shadow-sm" style={{ marginBottom: '20px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '28px', paddingBottom: '28px' }}>
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
                <Link href={`/profile/${post.profiles.username}`} className="font-bold text-foreground truncate text-base hover:underline">
                  {post.profiles.full_name || post.profiles.username}
                </Link>
              </div>
              <Link href={`/profile/${post.profiles.username}`} className="text-sm text-muted-foreground hover:underline">
                @{post.profiles.username}
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-foreground text-base whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={post.image_url} alt="Post image" className="w-full max-w-[500px] h-auto object-contain" />
            </div>
          )}

          {/* Timestamp */}
          <p className="text-muted-foreground text-sm" style={{ marginBottom: '12px' }}>{formatDate(post.created_at)}</p>

          {/* Stats */}
          <div className="flex items-center gap-6 border-y border-border" style={{ paddingTop: '12px', paddingBottom: '12px', marginBottom: '12px' }}>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">{likeCount}</span>
              <span className="text-muted-foreground text-sm">Likes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">{comments.length}</span>
              <span className="text-muted-foreground text-sm">Comments</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6" style={{ paddingTop: '4px' }}>
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comment Form */}
        {currentUser && (
          <div className="rounded-[20px] border shadow-sm" style={{ marginBottom: '20px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            {replyingTo && (
              <div className="flex items-center justify-between rounded-lg mb-3" style={{ padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-[#10B981]" />
                  <span className="text-sm text-muted-foreground">
                    Replying to <span className="text-[#10B981]">@{replyingTo.profiles.username}</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setReplyingTo(null)
                    setNewComment('')
                  }}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
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
                    placeholder={replyingTo ? "Post your reply..." : "Post your reply"}
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none resize-none leading-relaxed text-[15px]"
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
                  className="bg-[#10B981] hover:bg-[#0ea472] text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px' }}
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
            <div className="rounded-[20px] border shadow-sm" style={{ paddingTop: '80px', paddingBottom: '80px', paddingLeft: '40px', paddingRight: '40px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col items-center justify-center">
                <MessageCircle className="w-24 h-24 text-muted-foreground mb-6 opacity-25" />
                <p className="text-muted-foreground text-lg">No comments yet. Be the first to reply!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-[20px] border shadow-sm hover:bg-[#252527] transition-all group" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                  {editingComment?.id === comment.id ? (
                    /* Edit Mode */
                    <div className="flex gap-3">
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
                      <div className="flex-1">
                        <textarea
                          value={editContent}
                          onChange={(e) => {
                            setEditContent(e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                          }}
                          className="w-full rounded-xl outline-none resize-none leading-relaxed text-[15px]"
                          style={{ padding: '12px', minHeight: '60px', maxHeight: '200px', overflow: 'auto', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleCancelEdit}
                            className="bg-muted hover:bg-accent text-foreground font-semibold rounded-full transition-colors"
                            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim()}
                            className="bg-[#10B981] hover:bg-[#0ea472] text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px' }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
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
                        <div className="flex items-start gap-2 mb-1 flex-wrap">
                          <Link href={`/profile/${comment.profiles.username}`} className="font-bold text-foreground hover:underline truncate">
                            {comment.profiles.full_name || comment.profiles.username}
                          </Link>
                          <Link href={`/profile/${comment.profiles.username}`} className="text-muted-foreground text-sm hover:underline truncate">
                            @{comment.profiles.username}
                          </Link>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed text-[15px] mb-2">{comment.content}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleCommentLike(comment)}
                            disabled={likingCommentId === comment.id}
                            className={`text-xs flex items-center gap-1 transition-colors ${
                              comment.is_liked
                                ? 'text-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-red-500' : ''}`} />
                            {comment.likes_count || 0}
                          </button>
                          <button
                            onClick={() => handleStartReply(comment)}
                            className="text-xs text-muted-foreground hover:text-[#10B981] flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                          {currentUser?.id && currentUser.id !== comment.user_id && (
                            <button
                              onClick={() => setReportingComment(comment)}
                              className="text-xs text-muted-foreground hover:text-yellow-500 flex items-center gap-1 transition-colors"
                            >
                              <Flag className="w-3 h-3" />
                              Report
                            </button>
                          )}
                          {currentUser?.id === comment.user_id && (
                            <>
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className="text-xs text-muted-foreground hover:text-blue-500 flex items-center gap-1 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Report Comment Modal */}
      {reportingComment && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setReportingComment(null)}
        >
          <div 
            className="rounded-[20px] border max-w-md w-full"
            style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Comment</h3>
              </div>
              
              <p className="text-sm" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                Help us understand what's wrong with this comment.
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
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please explain why you're reporting this..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500 resize-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReportingComment(null)}
                  disabled={isReporting}
                  className="flex-1 px-8 py-4 font-semibold rounded-full transition-colors disabled:opacity-50 text-base"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportComment}
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
    </div>
  )
}
