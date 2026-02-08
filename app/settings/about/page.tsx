'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Shield, Code, Users, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AboutPage() {
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>About BeBusy</h1>
      </div>

      {/* App Info */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>BeBusy</h2>
          <p className="mb-1" style={{ color: 'var(--text-muted)' }}>Version 0.1.0-beta</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build 2026.02.08</p>
        </div>
      </div>

      {/* Mission */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>What is BeBusy?</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            BeBusy is a platform that helps students and young builders turn motivation into consistent daily action. 
            Users join small, focused groups around a goal—like coding, design, or content creation—and get a simple daily prompt: 
            <span className="font-medium"> What will I work on today? What did I finish yesterday?</span>
          </p>
          <p className="text-sm leading-relaxed mt-4" style={{ color: 'var(--text-primary)' }}>
            This creates lightweight accountability, public streaks, and social reinforcement. Mentors can give feedback, 
            helping users avoid getting stuck, while progress and completed projects build a living portfolio they can share 
            with employers or collaborators.
          </p>
          <p className="text-sm leading-relaxed mt-4" style={{ color: 'var(--text-primary)' }}>
            BeBusy is designed to make daily action <span className="font-medium">frictionless, visible, and habitual.</span>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Key Features</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <ul className="space-y-3">
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Daily prompts for consistent action</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Small, focused groups around your goals</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Public streaks and social accountability</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Mentor feedback to avoid getting stuck</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Build a living portfolio of completed projects</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Share progress with employers and collaborators</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Built With</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
              <Code className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                BeBusy is built with modern web technologies to provide you with 
                a fast, secure, and reliable experience.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Next.js 14</span>
                <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>React</span>
                <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>TypeScript</span>
                <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Supabase</span>
                <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Legal</h2>
        </div>
        
        <a
          href="https://bebusy.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Terms of Service</p>
            </div>
          </div>
        </a>

        <a
          href="https://bebusy.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Privacy Policy</p>
            </div>
          </div>
        </a>

        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 BeBusy. All rights reserved.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
