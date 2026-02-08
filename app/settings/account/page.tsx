'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { AppLayout } from '@/components/AppLayout'
import { 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Globe, 
  Trash2, 
  LogOut,
  ChevronRight,
  Shield,
  Palette,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
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
      <h1 className="text-2xl font-bold" style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Settings</h1>

      {/* Account Section */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Account</h2>
        </div>
        
        <Link href="/settings/edit-profile" className="flex items-center justify-between transition-colors border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <User className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Edit Profile</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Change your profile information</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link href="/settings/notifications" className="flex items-center justify-between transition-colors border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Bell className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Notifications</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage notification preferences</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link href="/settings/privacy" className="flex items-center justify-between transition-colors" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Lock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Privacy & Security</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Control your privacy settings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* Preferences Section */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Preferences</h2>
        </div>
        
        <Link href="/settings/appearance" className="flex items-center justify-between transition-colors border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Palette className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Appearance</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Theme and display settings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link href="/settings/language" className="flex items-center justify-between transition-colors" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Globe className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Language</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>English</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* Support Section */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Support</h2>
        </div>
        
        <Link href="/settings/help" className="flex items-center justify-between transition-colors border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Help & Support</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Get help with BeBusy</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link href="/settings/about" className="flex items-center justify-between transition-colors" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>About BeBusy</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Version 1.0.0</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Danger Zone</h2>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-red-500">Log Out</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign out of your account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </button>

        <Link href="/settings/delete-account" className="flex items-center justify-between transition-colors" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-red-500">Delete Account</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Permanently delete your account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>
    </AppLayout>
  )
}
