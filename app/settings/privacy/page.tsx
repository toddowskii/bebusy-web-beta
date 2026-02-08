'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getUserSettings, updateUserSettings, changePassword } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Lock, Eye, EyeOff, Shield, Users, MessageSquare, Tag, Activity, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PrivacyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentProfile = await getCurrentProfile()
      if (!currentProfile) {
        router.push('/login')
        return
      }
      setProfile(currentProfile)

      const { data: userSettings } = await getUserSettings(currentProfile.id)
      setSettings(userSettings)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: string, value: boolean) => {
    if (!profile || !settings) return

    setSaving(true)
    try {
      const updates = { [key]: value }
      const { error } = await updateUserSettings(profile.id, updates)
      
      if (error) throw error
      
      setSettings({ ...settings, ...updates })
      toast.success('Settings updated')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectChange = async (key: string, value: string) => {
    if (!profile || !settings) return

    setSaving(true)
    try {
      const updates = { [key]: value }
      const { error } = await updateUserSettings(profile.id, updates)
      
      if (error) throw error
      
      setSettings({ ...settings, ...updates })
      toast.success('Settings updated')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      const { error } = await changePassword(currentPassword, newPassword)
      
      if (error) throw error
      
      toast.success('Password changed successfully')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AppLayout username={profile?.username}>
      {/* Header */}
      <div className="flex items-center gap-4" style={{ marginBottom: '24px' }}>
        <Link
          href="/settings/account"
          className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Privacy & Security</h1>
      </div>

      {/* Security */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Security</h2>
        </div>
        
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Lock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-left">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Change Password</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Update your account password</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </button>

        <Link
          href="/settings/blocked-users"
          className="flex items-center justify-between transition-colors"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Blocked Users</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage blocked accounts</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* Privacy */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Privacy Controls</h2>
        </div>
        
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Eye className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile Visibility</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Who can see your profile</p>
            </div>
          </div>
          <select
            value={settings?.profile_visibility || 'public'}
            onChange={(e) => handleSelectChange('profile_visibility', e.target.value)}
            disabled={saving}
            className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', border: '1px solid', color: 'var(--text-primary)' }}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Allow Messages From</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Who can send you messages</p>
            </div>
          </div>
          <select
            value={settings?.allow_messages_from || 'everyone'}
            onChange={(e) => handleSelectChange('allow_messages_from', e.target.value)}
            disabled={saving}
            className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', border: '1px solid', color: 'var(--text-primary)' }}
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers Only</option>
            <option value="none">No One</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Online Status</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Let others see when you're online</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('show_online_status', !settings?.show_online_status)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.show_online_status ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.show_online_status ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Tag className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Allow Tags</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Let others tag you in posts</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('allow_tags', !settings?.allow_tags)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.allow_tags ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.allow_tags ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Activity className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Activity Status</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Display your activity to others</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('show_activity', !settings?.show_activity)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.show_activity ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.show_activity ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ padding: '20px' }}>
          <div className="rounded-[20px] border w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="border-b" style={{ padding: '20px', borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} style={{ padding: '20px' }}>
              {/* Current Password */}
              <div style={{ marginBottom: '16px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100"
                    style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="flex-1 px-6 py-3 rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
