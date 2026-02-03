'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Send } from 'lucide-react'
import { createPost } from '@/lib/supabase/posts'
import { supabase } from '@/lib/supabase/client'
import { validateImageUpload, generateSafeFilename } from '@/lib/security/upload'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
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

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && !imageFile) {
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl: string | undefined

      // Upload image if present
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

      // Create post
      await createPost(content.trim(), imageUrl)

      // Reset form
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success('Post created!')
      onPostCreated?.()
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-4">
      <form onSubmit={handleSubmit}>
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative mb-3 rounded-2xl overflow-hidden">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-[#000000]/80 hover:bg-[#000000] rounded-full transition-all"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                {username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Input */}
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you working on?"
            className="flex-1 bg-transparent text-[#9BA1A6] text-base placeholder-[#9BA1A6] outline-none"
            disabled={isSubmitting}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !imageFile)}
            className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:hover:bg-[#10B981] flex-shrink-0"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

