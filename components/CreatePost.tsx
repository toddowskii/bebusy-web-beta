'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Send } from 'lucide-react'
import { createPost } from '@/lib/supabase/posts'
import { supabase } from '@/lib/supabase/client'
import { validateImageUpload, generateSafeFilename } from '@/lib/security/upload'
import { containsScriptLike } from '@/lib/security/sanitize'
import toast from 'react-hot-toast'

interface CreatePostProps {
  userAvatar?: string
  username: string
  onPostCreated?: () => void
}

export function CreatePost({ userAvatar, username, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processImage(file)
  }

  const processImage = (file: File) => {
    const validation = validateImageUpload(file)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsExpanded(true)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processImage(files[0])
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!content.trim() && !imageFile) {
      setIsExpanded(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (containsScriptLike(content)) {
      toast.error('Scripts are not allowed in posts')
      return
    }

    if (!content.trim() && !imageFile) {
      toast.error('Post must include text or an image')
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl: string | undefined

      if (imageFile) {
        const safeFilename = generateSafeFilename(imageFile.name)
        const filePath = `posts/${safeFilename}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      await createPost(content.trim(), imageUrl)

      setContent('')
      setImageFile(null)
      setImagePreview(null)
      setIsExpanded(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success('Post shared! 🚀')
      onPostCreated?.()
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = (content.trim() || imageFile) && !isSubmitting

  // Collapsed state
  if (!isExpanded) {
    return (
      <div 
        className="cursor-pointer"
        style={{ marginBottom: '16px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="rounded-[20px] transition-all" style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}>
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={username}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {username[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left text-base"
              style={{ color: 'var(--text-muted)' }}
            >
              What are you working on?
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="rounded-[20px]" style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', marginBottom: '16px' }}>
      <form onSubmit={handleSubmit}>
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative border-b" style={{ borderColor: 'var(--border)', backgroundColor: '#0F0F0F' }}>
            <div className="relative inline-block w-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-full h-auto object-contain max-h-[300px]"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-2 hover:bg-red-500 rounded-full transition-all duration-200 shadow-lg"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={username}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{username}</span>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Create a post</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-3" style={{ marginBottom: '12px' }}>
            <style jsx>{`
              textarea::placeholder {
                color: var(--text-muted);
                opacity: 1;
              }
            `}</style>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you're building, learning, or discovering..."
              className="w-full bg-transparent text-base outline-none resize-none"
              style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t" style={{ borderColor: 'var(--border)', paddingTop: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || imageFile !== null}
              className="flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => !isSubmitting && !imageFile && (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm">Photo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className="rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
                onMouseEnter={(e) => !(isSubmitting || (!content.trim() && !imageFile)) && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className="rounded-full font-semibold transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--primary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
                onMouseEnter={(e) => !(!isValid) && (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

