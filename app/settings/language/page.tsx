'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Globe, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
]

export default function LanguagePage() {
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

  const handleLanguageChange = async (languageCode: string) => {
    if (!profile || !settings) return

    setSaving(true)
    try {
      const { error } = await updateUserSettings(profile.id, { language: languageCode })
      
      if (error) throw error
      
      setSettings({ ...settings, language: languageCode })
      toast.success('Language updated')
    } catch (error) {
      console.error('Error updating language:', error)
      toast.error('Failed to update language')
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Language</h1>
      </div>

      {/* Language Selection */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Select Language</h2>
        </div>
        
        <div>
          {languages.map((language, index) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={saving}
              className="w-full flex items-center justify-between transition-colors"
              style={{
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: index < languages.length - 1 ? '1px solid' : 'none',
                borderColor: 'var(--border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{language.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{language.nativeName}</p>
                </div>
              </div>
              {settings?.language === language.code && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-[20px] border" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> Language translations are currently in development. 
          The app interface will remain in English for now, but your language preference will be saved for future updates.
        </p>
      </div>
    </AppLayout>
  )
}
