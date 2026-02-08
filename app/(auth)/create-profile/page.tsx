'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { createProfile, isUsernameAvailable } from '@/lib/supabase/profiles'
import toast from 'react-hot-toast'
import { User, AtSign, FileText, Upload, ArrowRight } from 'lucide-react'

export default function CreateProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get the current user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
        setEmail(data.user.email || '')
      } else {
        router.push('/signup')
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    // Check username availability with debounce
    if (username.length < 3) {
      setUsernameValid(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setUsernameChecking(true)
      const available = await isUsernameAvailable(username)
      setUsernameValid(available)
      setUsernameChecking(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('User not found. Please sign up again.')
      return
    }

    if (fullName && !/^[a-zA-Z\s'-]+$/.test(fullName)) {
      toast.error('Full name can only contain letters, spaces, hyphens, and apostrophes')
      return
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    if (!usernameValid) {
      toast.error('Username is already taken')
      return
    }

    setLoading(true)

    try {
      // Create profile
      const profile = await createProfile({
        id: userId,
        email: email,
        full_name: fullName,
        username: username,
        bio: bio || null,
      })

      if (!profile) {
        throw new Error('Failed to create profile')
      }

      // Upload avatar if provided
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${userId}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

          // Update profile with avatar URL
          await supabase
            .from('profiles')
            // @ts-expect-error - Supabase type inference issue
            .update({ avatar_url: publicUrl })
            .eq('id', userId)
        }
      }

      toast.success('Profile created successfully!')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[20px] border" style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <h2 className="text-2xl font-bold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Complete Your Profile</h2>
      <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>Tell us a bit about yourself</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Avatar Upload */}
        <div className="flex flex-col items-center" style={{ marginBottom: '12px' }}>
          <div className="relative">
            <div className="rounded-full flex items-center justify-center overflow-hidden" style={{ width: '96px', height: '96px', backgroundColor: 'var(--bg-tertiary)' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <User style={{ width: '48px', height: '48px', color: 'var(--text-muted)' }} />
              )}
            </div>
            <label
              htmlFor="avatar"
              className="absolute bg-[#10B981] rounded-full cursor-pointer hover:bg-[#059669] transition-colors"
              style={{ bottom: '0', right: '0', padding: '8px' }}
            >
              <Upload className="text-white" style={{ width: '16px', height: '16px' }} />
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-[#8E8E93]" style={{ marginTop: '8px' }}>Click to upload avatar</p>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--text-muted)' }} />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
              const value = e.target.value
              // Only allow letters, spaces, hyphens, and apostrophes
              if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
                setFullName(value)
              }
            }}
              required
              className="w-full border rounded-[12px] focus:outline-none focus:border-[#10B981] transition-colors"
              style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-[#FFFFFF]" style={{ marginBottom: '8px' }}>
            Username *
          </label>
          <div className="relative">
            <AtSign className="absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--text-muted)' }} />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
              className={`w-full border rounded-[12px] focus:outline-none transition-colors ${
                usernameValid === false
                  ? 'border-red-500 focus:border-red-500'
                  : usernameValid === true
                  ? 'border-green-500 focus:border-green-500'
                  : 'focus:border-[#10B981]'
              }`}
              style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: usernameValid === null ? 'var(--border)' : undefined }}
              placeholder="johndoe"
            />
            {usernameChecking && (
              <div className="absolute" style={{ right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" style={{ width: '20px', height: '20px' }}></div>
              </div>
            )}
          </div>
          {usernameValid === false && (
            <p className="text-red-500 text-sm" style={{ marginTop: '4px' }}>Username already taken</p>
          )}
          {usernameValid === true && (
            <p className="text-green-500 text-sm" style={{ marginTop: '4px' }}>Username available</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Bio (optional)
          </label>
          <div className="relative">
            <FileText className="absolute" style={{ left: '16px', top: '14px', width: '20px', height: '20px', color: 'var(--text-muted)' }} />
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full border rounded-[12px] focus:outline-none focus:border-[#10B981] transition-colors resize-none"
              style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="Tell us about yourself..."
            />
          </div>
          <p className="text-sm text-right" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>{bio.length}/160</p>
        </div>

        <button
          type="submit"
          disabled={loading || !usernameValid}
          className="w-full bg-[#10B981] hover:bg-[#059669] disabled:cursor-not-allowed text-white font-semibold rounded-[12px] transition-colors flex items-center justify-center gap-2"
          style={{ paddingTop: '14px', paddingBottom: '14px', marginTop: '8px', opacity: (loading || !usernameValid) ? 0.5 : 1, backgroundColor: (loading || !usernameValid) ? 'var(--bg-tertiary)' : undefined }}
        >
          {loading ? 'Creating profile...' : 'Complete Profile'}
          {!loading && <ArrowRight style={{ width: '20px', height: '20px' }} />}
        </button>
      </form>
    </div>
  )
}
