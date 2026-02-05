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
        <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] hover:bg-[#252527] transition-all" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
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
              className="flex-1 text-[#9BA1A6] text-left text-base"
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
    <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ marginBottom: '16px' }}>
      <form onSubmit={handleSubmit}>
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative border-b border-[#2C2C2E] bg-[#0F0F0F]">
            <div className="relative inline-block w-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-full h-auto object-contain max-h-[300px]"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-2 bg-[#000000]/80 hover:bg-red-500 rounded-full transition-all duration-200 shadow-lg"
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
                <span className="font-bold text-[#FFFFFF] text-base">{username}</span>
              </div>
              <span className="text-sm text-[#8E8E93]">Create a post</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-3" style={{ marginBottom: '12px' }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you're building, learning, or discovering..."
              className="w-full bg-transparent text-[#FFFFFF] text-base placeholder-[#8E8E93] outline-none resize-none"
              rows={4}
              disabled={isSubmitting}
              style={{ lineHeight: '1.5' }}
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
          <div className="flex items-center justify-between border-t border-[#2C2C2E]" style={{ paddingTop: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || imageFile !== null}
              className="flex items-center gap-1.5 text-[#8E8E93] hover:text-[#10B981] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm">Photo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className="bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-full font-semibold transition-colors text-[#ECEDEE] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className="bg-[#10B981] hover:bg-[#059669] rounded-full font-semibold transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '8px' }}
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

