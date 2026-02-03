'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile, updateProfile, uploadAvatar, uploadBanner } from '@/lib/supabase/profiles'
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
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 0 })
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
      
      // Initialize crop area (centered square)
      const size = Math.min(img.width, img.height)
      setCropArea({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        size: size
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

    setBannerFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setBannerPreview(event.target?.result as string)
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

    const outputSize = 400
    canvas.width = outputSize
    canvas.height = outputSize

    // Draw cropped and resized image
    ctx.drawImage(
      imageToCrop,
      cropArea.x, cropArea.y, cropArea.size, cropArea.size,
      0, 0, outputSize, outputSize
    )

    // Convert to blob
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
      x <= cropArea.x + cropArea.size &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.size
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

    const newX = Math.max(0, Math.min(x - dragStart.x, imageToCrop.width - cropArea.size))
    const newY = Math.max(0, Math.min(y - dragStart.y, imageToCrop.height - cropArea.size))

    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    if (!imageToCrop) return

    const newSize = Math.max(100, Math.min(cropArea.size + delta, Math.min(imageToCrop.width, imageToCrop.height)))
    
    // Adjust position to keep centered
    const deltaSize = newSize - cropArea.size
    const newX = Math.max(0, Math.min(cropArea.x - deltaSize / 2, imageToCrop.width - newSize))
    const newY = Math.max(0, Math.min(cropArea.y - deltaSize / 2, imageToCrop.height - newSize))

    setCropArea({ x: newX, y: newY, size: newSize })
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
    const cropSize = cropArea.size * displayScale

    ctx.clearRect(cropX, cropY, cropSize, cropSize)
    ctx.drawImage(
      imageToCrop,
      cropArea.x, cropArea.y, cropArea.size, cropArea.size,
      cropX, cropY, cropSize, cropSize
    )

    // Draw crop border
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 3
    ctx.strokeRect(cropX, cropY, cropSize, cropSize)
    
    // Draw corner handles
    ctx.fillStyle = '#10B981'
    const handleSize = 12
    // Top-left
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Top-right
    ctx.fillRect(cropX + cropSize - handleSize/2, cropY - handleSize/2, handleSize, handleSize)
    // Bottom-left
    ctx.fillRect(cropX - handleSize/2, cropY + cropSize - handleSize/2, handleSize, handleSize)
    // Bottom-right
    ctx.fillRect(cropX + cropSize - handleSize/2, cropY + cropSize - handleSize/2, handleSize, handleSize)
  }, [showCropModal, imageToCrop, cropArea])

  const handleSave = async () => {
    if (!profile) return

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#ECEDEE]" />
          </button>
          <h2 className="text-2xl font-bold text-[#ECEDEE]">Edit Profile</h2>
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
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ marginBottom: '16px', padding: '24px' }}>
        <h3 className="text-lg font-semibold text-[#ECEDEE]" style={{ marginBottom: '16px' }}>Cover Banner</h3>
        <div className="relative" style={{ marginBottom: '12px' }}>
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Cover banner"
              className="w-full h-40 object-cover rounded-xl border-2 border-[#2C2C2E]"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 rounded-xl border-2 border-[#2C2C2E] flex items-center justify-center">
              <Camera className="w-8 h-8 text-[#8E8E93]" />
            </div>
          )}
        </div>
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="w-full bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#ECEDEE] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          style={{ paddingTop: '12px', paddingBottom: '12px' }}
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
        <p className="text-xs text-[#8E8E93]" style={{ marginTop: '8px' }}>Recommended size: 1500x500px. Max 5MB</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ marginBottom: '16px', padding: '24px' }}>
        <h3 className="text-lg font-semibold text-[#ECEDEE]" style={{ marginBottom: '16px' }}>Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#2C2C2E]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-3xl border-2 border-[#2C2C2E]">
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
            <p className="text-sm text-[#ECEDEE] font-medium" style={{ marginBottom: '4px' }}>Change your profile picture</p>
            <p className="text-xs text-[#8E8E93]">JPG, PNG or GIF. Max size 5MB</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ marginBottom: '16px', padding: '24px' }}>
        <h3 className="text-lg font-semibold text-[#ECEDEE]" style={{ marginBottom: '20px' }}>Profile Information</h3>
        
        {/* Username (read-only) */}
        <div style={{ marginBottom: '20px' }}>
          <label className="block text-sm font-medium text-[#9BA1A6]" style={{ marginBottom: '8px' }}>Username</label>
          <input
            type="text"
            value={profile?.username || ''}
            disabled
            className="w-full bg-[#2C2C2E]/50 text-[#8E8E93] rounded-xl border border-[#2C2C2E] cursor-not-allowed"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
          <p className="text-xs text-[#8E8E93]" style={{ marginTop: '4px' }}>Username cannot be changed</p>
        </div>

        {/* Full Name */}
        <div style={{ marginBottom: '20px' }}>
          <label className="block text-sm font-medium text-[#9BA1A6]" style={{ marginBottom: '8px' }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            maxLength={50}
            className="w-full bg-[#2C2C2E] text-[#ECEDEE] rounded-xl border border-[#2C2C2E] focus:border-[#10B981] focus:outline-none transition-colors placeholder:text-[#8E8E93]"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
          <p className="text-xs text-[#8E8E93]" style={{ marginTop: '4px' }}>{fullName.length}/50</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[#9BA1A6]" style={{ marginBottom: '8px' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            maxLength={160}
            rows={4}
            className="w-full bg-[#2C2C2E] text-[#ECEDEE] rounded-xl border border-[#2C2C2E] focus:border-[#10B981] focus:outline-none transition-colors resize-none placeholder:text-[#8E8E93]"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
          <p className="text-xs text-[#8E8E93]" style={{ marginTop: '4px' }}>{bio.length}/160</p>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] max-w-3xl w-full my-8" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h3 className="text-xl font-bold text-[#ECEDEE]">Crop Profile Picture</h3>
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setImageToCrop(null)
                }}
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#9BA1A6]" />
              </button>
            </div>

            <div className="flex justify-center" style={{ marginBottom: '20px' }}>
              <canvas
                ref={cropCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full h-auto cursor-move border-2 border-[#2C2C2E] rounded-xl"
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ marginBottom: '16px' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom(-50)}
                  className="px-4 py-2 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#ECEDEE] rounded-lg transition-colors font-semibold"
                >
                  −
                </button>
                <span className="text-sm text-[#9BA1A6] font-medium">Zoom</span>
                <button
                  onClick={() => handleZoom(50)}
                  className="px-4 py-2 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#ECEDEE] rounded-lg transition-colors font-semibold"
                >
                  +
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCropModal(false)
                    setImageToCrop(null)
                  }}
                  className="px-6 py-2.5 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#ECEDEE] font-semibold rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-full transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            <p className="text-sm text-[#9BA1A6] text-center">
              Drag to move • Use zoom buttons to resize the crop area
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
