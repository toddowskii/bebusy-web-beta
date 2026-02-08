'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { useTheme } from '@/components/ThemeProvider'
import { ArrowLeft, Palette, Moon, Sun, Monitor } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AppearancePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
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

  const handleThemeChange = async (newTheme: 'dark' | 'light' | 'auto') => {
    if (!profile || !settings) return

    setSaving(true)
    try {
      // Update theme immediately
      setTheme(newTheme)
      
      // Save to database
      const { error } = await updateUserSettings(profile.id, { theme: newTheme })
      
      if (error) throw error
      
      setSettings({ ...settings, theme: newTheme })
      toast.success('Theme updated')
    } catch (error) {
      console.error('Error updating theme:', error)
      toast.error('Failed to update theme')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
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
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h1>
      </div>

      {/* Theme Selection */}
      <div className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-tertiary)', marginBottom: '16px' }}>
        <div className="border-b" style={{ borderColor: 'var(--bg-tertiary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Theme</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="grid grid-cols-1 gap-3">
            {/* Dark Theme */}
            <button
              onClick={() => handleThemeChange('dark')}
              disabled={saving}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all`}
              style={{
                borderColor: theme === 'dark' ? '#10B981' : 'var(--bg-tertiary)',
                backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#000000] border border-[#2C2C2E] flex items-center justify-center">
                  <Moon className="w-6 h-6 text-[#ECEDEE]" />
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Easy on the eyes</p>
                </div>
              </div>
              {theme === 'dark' && (
                <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {/* Light Theme */}
            <button
              onClick={() => handleThemeChange('light')}
              disabled={saving}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all`}
              style={{
                borderColor: theme === 'light' ? '#10B981' : 'var(--bg-tertiary)',
                backgroundColor: theme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center">
                  <Sun className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Light</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bright and clear</p>
                </div>
              </div>
              {theme === 'light' && (
                <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {/* Auto Theme */}
            <button
              onClick={() => handleThemeChange('auto')}
              disabled={saving}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all`}
              style={{
                borderColor: theme === 'auto' ? '#10B981' : 'var(--bg-tertiary)',
                backgroundColor: theme === 'auto' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#000000] to-white border border-[#2C2C2E] flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-[#ECEDEE]" />
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Auto</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Match system theme</p>
                </div>
              </div>
              {theme === 'auto' && (
                <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Color Scheme (Coming Soon) */}
      <div className="bg-card rounded-[20px] border border-border overflow-hidden" style={{ marginBottom: '16px' }}>
        <div className="border-b border-border" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">Accent Color</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="font-medium text-foreground">Green (Default)</p>
              <p className="text-sm text-muted-foreground">Your current accent color</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-[#10B981] border-2 border-[#10B981] cursor-pointer"></div>
            <div className="w-12 h-12 rounded-full bg-[#3B82F6] border-2 border-transparent opacity-50 cursor-not-allowed"></div>
            <div className="w-12 h-12 rounded-full bg-[#8B5CF6] border-2 border-transparent opacity-50 cursor-not-allowed"></div>
            <div className="w-12 h-12 rounded-full bg-[#F59E0B] border-2 border-transparent opacity-50 cursor-not-allowed"></div>
            <div className="w-12 h-12 rounded-full bg-[#EF4444] border-2 border-transparent opacity-50 cursor-not-allowed"></div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">More colors coming soon</p>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-card rounded-[20px] border border-border overflow-hidden">
        <div className="border-b border-border" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">Display</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-foreground">Font Size</p>
              <p className="text-sm text-muted-foreground">Medium (Default)</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">Additional display options coming soon</p>
        </div>
      </div>
    </AppLayout>
  )
}
