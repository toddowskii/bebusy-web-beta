'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile, updateProfile, uploadAvatar, uploadBanner } from '@/lib/supabase/profiles'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import TagPicker from '@/components/TagPicker'
import { ArrowLeft, Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<HTMLImageElement | null>(null)
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar')
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const currentProfile = await getCurrentProfile()
      if (!currentProfile) {
        router.push('/login')
        return
      }
      
      setProfile(currentProfile)
      setFullName(currentProfile.full_name || '')
      setBio(currentProfile.bio || '')
      setAvatarPreview(currentProfile.avatar_url)
      setBannerPreview(currentProfile.cover_url)
      setSelectedTags(currentProfile.tags || [])
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Load image for cropping
    const img = new Image()
    const reader = new FileReader()
    
    reader.onload = (event) => {
      img.src = event.target?.result as string
    }

    img.onload = () => {
      setImageToCrop(img)
      setCropType('avatar')
      
      // Initialize crop area (centered square)
      const size = Math.min(img.width, img.height)
      setCropArea({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        width: size,
        height: size
      })
      
      setShowCropModal(true)
    }

    reader.readAsDataURL(file)
  }

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImageToCrop(img)
        setCropType('banner')
        
        // For banner, use 3:1 aspect ratio (width:height)
        const bannerHeight = Math.min(img.height, img.width / 3)
        const bannerWidth = bannerHeight * 3
        
        setCropArea({
          x: (img.width - bannerWidth) / 2,
          y: (img.height - bannerHeight) / 2,
          width: bannerWidth,
          height: bannerHeight
        })
        setShowCropModal(true)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = () => {
    if (!imageToCrop) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      toast.error('Failed to process image')
      return
    }

    if (cropType === 'avatar') {
      // Avatar: Square output 400x400
      const outputSize = 400
      canvas.width = outputSize
      canvas.height = outputSize

      ctx.drawImage(
        imageToCrop,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, outputSize, outputSize
      )

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to process image')
          return
        }

        const resizedFile = new File([blob], 'avatar.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now()
        })

        setAvatarFile(resizedFile)
        setAvatarPreview(canvas.toDataURL('image/jpeg'))
        setShowCropModal(false)
        setImageToCrop(null)
      }, 'image/jpeg', 0.9)
    } else {
      // Banner: 3:1 aspect ratio, max 1200x400
      const outputWidth = 1200
      const outputHeight = 400
      canvas.width = outputWidth
      canvas.height = outputHeight

      ctx.drawImage(
        imageToCrop,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, outputWidth, outputHeight
      )

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to process image')
          return
        }

        const resizedFile = new File([blob], 'banner.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now()
        })

        setBannerFile(resizedFile)
        setBannerPreview(canvas.toDataURL('image/jpeg'))
        setShowCropModal(false)
        setImageToCrop(null)
      }, 'image/jpeg', 0.9)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = cropCanvasRef.current
    if (!canvas || !imageToCrop) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = imageToCrop.width / rect.width
    const scaleY = imageToCrop.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Check if click is inside crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = cropCanvasRef.current
    if (!canvas || !imageToCrop || e.touches.length !== 1) return

    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const scaleX = imageToCrop.width / rect.width
    const scaleY = imageToCrop.height / rect.height
    
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    // Check if touch is inside crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imageToCrop) return

    const canvas = cropCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = imageToCrop.width / rect.width
    const scaleY = imageToCrop.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const newX = Math.max(0, Math.min(x - dragStart.x, imageToCrop.width - cropArea.width))
    const newY = Math.max(0, Math.min(y - dragStart.y, imageToCrop.height - cropArea.height))

    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imageToCrop || e.touches.length !== 1) return

    e.preventDefault() // Prevent scrolling while dragging

    const touch = e.touches[0]
    const canvas = cropCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = imageToCrop.width / rect.width
    const scaleY = imageToCrop.height / rect.height
    
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    const newX = Math.max(0, Math.min(x - dragStart.x, imageToCrop.width - cropArea.width))
    const newY = Math.max(0, Math.min(y - dragStart.y, imageToCrop.height - cropArea.height))

    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    if (!imageToCrop) return

    if (cropType === 'avatar') {
      // Avatar: Maintain square aspect ratio
      const newSize = Math.max(100, Math.min(cropArea.width + delta, Math.min(imageToCrop.width, imageToCrop.height)))
      
      const deltaSize = newSize - cropArea.width
      const newX = Math.max(0, Math.min(cropArea.x - deltaSize / 2, imageToCrop.width - newSize))
      const newY = Math.max(0, Math.min(cropArea.y - deltaSize / 2, imageToCrop.height - newSize))

      setCropArea({ x: newX, y: newY, width: newSize, height: newSize })
    } else {
      // Banner: Maintain 3:1 aspect ratio
      const newHeight = Math.max(100, Math.min(cropArea.height + delta, imageToCrop.height))
      const newWidth = newHeight * 3
      
      // Make sure it fits within image bounds
      const finalWidth = Math.min(newWidth, imageToCrop.width)
      const finalHeight = finalWidth / 3
      
      const deltaWidth = finalWidth - cropArea.width
      const deltaHeight = finalHeight - cropArea.height
      const newX = Math.max(0, Math.min(cropArea.x - deltaWidth / 2, imageToCrop.width - finalWidth))
      const newY = Math.max(0, Math.min(cropArea.y - deltaHeight / 2, imageToCrop.height - finalHeight))

      setCropArea({ x: newX, y: newY, width: finalWidth, height: finalHeight })
    }
  }

  // Draw crop preview
  useEffect(() => {
    if (!showCropModal || !imageToCrop || !cropCanvasRef.current) return

    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fit container (max width based on viewport)
    const maxWidth = Math.min(600, window.innerWidth - 80) // 40px padding on each side
    const maxHeight = window.innerHeight - 300 // Leave room for header, buttons, etc.
    
    const scale = Math.min(
      maxWidth / imageToCrop.width,
      maxHeight / imageToCrop.height,
      1 // Don't scale up
    )
    
    canvas.width = imageToCrop.width * scale
    canvas.height = imageToCrop.height * scale

    // Draw image
    ctx.drawImage(imageToCrop, 0, 0, canvas.width, canvas.height)

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear crop area
    const displayScale = canvas.width / imageToCrop.width
    const cropX = cropArea.x * displayScale
    const cropY = cropArea.y * displayScale
    const cropWidth = cropArea.width * displayScale
    const cropHeight = cropArea.height * displayScale

    ctx.clearRect(cropX, cropY, cropWidth, cropHeight)
    ctx.drawImage(
      imageToCrop,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      cropX, cropY, cropWidth, cropHeight
    )

    // Draw crop border
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 3
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
    
    // Draw corner handles
    ctx.fillStyle = '#10B981'
    const handleSize = 12
    // Top-left
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Top-right
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Bottom-left
    ctx.fillRect(cropX - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize)
    // Bottom-right
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize)
  }, [showCropModal, imageToCrop, cropArea])

  const handleSave = async () => {
    if (!profile) return

    if (fullName && !/^[a-zA-Z\s'-]+$/.test(fullName.trim())) {
      toast.error('Full name can only contain letters, spaces, hyphens, and apostrophes')
      return
    }

    setSaving(true)
    try {
      let avatarUrl = profile.avatar_url
      let coverUrl = profile.cover_url

      // Upload new avatar if selected
      if (avatarFile) {
        const reader = new FileReader()
        const avatarDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(avatarFile)
        })
        const uploadedUrl = await uploadAvatar(profile.id, avatarDataUrl)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        } else {
          throw new Error('Failed to upload avatar')
        }
      }

      // Upload new banner if selected
      if (bannerFile) {
        const reader = new FileReader()
        const bannerDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(bannerFile)
        })
        const uploadedUrl = await uploadBanner(profile.id, bannerDataUrl)
        if (uploadedUrl) {
          coverUrl = uploadedUrl
        } else {
          throw new Error('Failed to upload banner')
        }
      }

      // Update profile
      const updates: any = {
        full_name: fullName.trim() || profile.full_name,
        bio: bio.trim() || profile.bio,
      }

      if (avatarUrl && avatarUrl !== profile.avatar_url) {
        updates.avatar_url = avatarUrl
      }
      if (coverUrl && coverUrl !== profile.cover_url) {
        updates.cover_url = coverUrl
      }
      updates.tags = selectedTags

      console.log('Updating profile with:', updates)
      const result = await updateProfile(profile.id, updates)
      console.log('Update result:', result)

      toast.success('Profile updated!')
      router.push(`/profile/${profile.username}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-full disabled:opacity-50 transition-all"
          style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Banner Section */}
      <div className="rounded-[20px] border" style={{ marginBottom: '16px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <h3 className="text-lg font-semibold" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Cover Banner</h3>
        <div className="relative" style={{ marginBottom: '12px' }}>
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Cover banner"
              className="w-full h-40 object-cover rounded-xl border-2"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
              <Camera className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
        </div>
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="w-full font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          style={{ paddingTop: '12px', paddingBottom: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        >
          <Camera className="w-4 h-4" />
          {bannerPreview ? 'Change Banner' : 'Add Banner'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerSelect}
          className="hidden"
        />
        <p className="text-xs" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Recommended size: 1500x500px. Max 5MB</p>
      </div>

      {/* Avatar Section */}
      <div className="rounded-[20px] border" style={{ marginBottom: '16px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <h3 className="text-lg font-semibold" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--border)' }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-3xl border-2" style={{ borderColor: 'var(--border)' }}>
                {profile?.username[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[#10B981] rounded-full hover:bg-[#059669] transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>Change your profile picture</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>JPG, PNG or GIF. Max size 5MB</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="rounded-[20px] border" style={{ marginBottom: '16px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <h3 className="text-lg font-semibold" style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Profile Information</h3>
        
        {/* Username (read-only) */}
        <div style={{ marginBottom: '20px' }}>
          <label className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Username</label>
          <input
            type="text"
            value={profile?.username || ''}
            disabled
            className="w-full rounded-xl border cursor-not-allowed"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: 'var(--bg-tertiary)', opacity: 0.5, color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          />
          <p className="text-xs" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Username cannot be changed</p>
        </div>

        {/* Full Name */}
        <div style={{ marginBottom: '20px' }}>
          <label className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              const value = e.target.value
              // Only allow letters, spaces, hyphens, and apostrophes
              if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
                setFullName(value)
              }
            }}
            placeholder="Your full name"
            maxLength={50}
            className="w-full rounded-xl border focus:outline-none transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          <p className="text-xs" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>{fullName.length}/50</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            maxLength={160}
            rows={4}
            className="w-full rounded-xl border focus:outline-none transition-colors resize-none"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          <p className="text-xs" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>{bio.length}/160</p>
        </div>

        {/* Tags */}
        <div className="rounded-[20px] border" style={{ marginBottom: '16px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Tags</h3>
          <TagPicker value={selectedTags} onChange={setSelectedTags} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-[20px] border max-w-4xl w-full my-8" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {cropType === 'avatar' ? 'Crop Profile Picture' : 'Crop Banner Image'}
              </h3>
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setImageToCrop(null)
                }}
                className="p-2 rounded-full transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="flex justify-center items-center bg-black/50 rounded-xl" style={{ marginBottom: '20px', minHeight: '400px' }}>
              <canvas
                ref={cropCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="max-w-full max-h-[70vh] h-auto cursor-move rounded-xl"
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ marginBottom: '16px' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleZoom(-50)}
                  className="rounded-xl transition-colors font-bold text-xl flex items-center justify-center"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  −
                </button>
                <span className="text-sm font-medium min-w-[60px] text-center" style={{ color: 'var(--text-muted)' }}>
                  {cropType === 'avatar' ? '1:1' : '3:1'}
                </span>
                <button
                  onClick={() => handleZoom(50)}
                  className="rounded-xl transition-colors font-bold text-xl flex items-center justify-center"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCropModal(false)
                    setImageToCrop(null)
                  }}
                  className="font-semibold rounded-full transition-colors"
                  style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-full transition-all"
                  style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  Crop & Apply
                </button>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)', opacity: 0.5 }}>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                <span className="text-[#10B981] font-semibold">Drag</span> to reposition • 
                <span className="text-[#10B981] font-semibold"> +/−</span> to zoom • 
                <span className="text-[#10B981] font-semibold"> {cropType === 'avatar' ? 'Square' : 'Banner (3:1)'}</span> ratio
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
