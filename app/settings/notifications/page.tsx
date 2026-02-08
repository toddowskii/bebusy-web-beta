'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Bell, Mail, MessageSquare, Heart, Users, AtSign, Flag } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

    // If user is enabling push notifications, request browser permission first
    setSaving(true)
    try {
      if (key === 'push_notifications' && value === true) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            toast.error('Push notifications permission denied')
            setSaving(false)
            return
          }
        } else {
          toast.error('Push notifications not supported in this browser')
          setSaving(false)
          return
        }
      }

      // If user is disabling push notifications, try to unsubscribe the
      // PushSubscription from the browser (and server if implemented).
      if (key === 'push_notifications' && value === false) {
        try {
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
              const subscription = await registration.pushManager.getSubscription()
              if (subscription) {
                await subscription.unsubscribe()
                // Optional: if you implement server-side subscription storage,
                // add a call here to remove the subscription from your DB.
              }
            }
          }
        } catch (err) {
          console.warn('Failed to unsubscribe from push subscription', err)
        }
      }

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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
      </div>

      {/* Push Notifications */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Push Notifications</h2>
        </div>
        
        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Bell className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Enable Push Notifications</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Get notified on this device</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('push_notifications', !settings?.push_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.push_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.push_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Receive notifications via email</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email_notifications', !settings?.email_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.email_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.email_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Activity Notifications */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Activity</h2>
        </div>
        
        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Heart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Likes</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone likes your post</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('like_notifications', !settings?.like_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.like_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.like_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Comments</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone comments on your post</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('comment_notifications', !settings?.comment_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.comment_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.comment_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Follows</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone follows you</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('follow_notifications', !settings?.follow_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.follow_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.follow_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <AtSign className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Mentions</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone mentions you</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('mention_notifications', !settings?.mention_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.mention_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.mention_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Messages</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>New direct messages</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('message_notifications', !settings?.message_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.message_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.message_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Flag className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Groups</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Activity in groups you joined</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('group_notifications', !settings?.group_notifications)}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: settings?.group_notifications ? 'var(--primary)' : 'var(--bg-tertiary)' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.group_notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
