'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, HelpCircle, Mail, MessageCircle, Book, FileText, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function HelpPage() {
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Help & Support</h1>
      </div>

      {/* Support Options */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Get Help</h2>
        </div>
        
        <a
          href="https://help.bebusy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Book className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Help Center</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Browse articles and guides</p>
            </div>
          </div>
        </a>

        <a
          href="mailto:support@bebusy.com"
          className="flex items-center justify-between transition-colors border-b"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Support</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>support@bebusy.com</p>
            </div>
          </div>
        </a>

        <button
          onClick={() => toast.success('Live chat coming soon!')}
          className="w-full flex items-center justify-between transition-colors"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-left">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Live Chat</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chat with our support team</p>
            </div>
          </div>
        </button>
      </div>

      {/* Resources */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Resources</h2>
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
              <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Terms of Service</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Read our terms and conditions</p>
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
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>How we protect your data</p>
            </div>
          </div>
        </a>

        <a
          href="https://bebusy.com/community"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between transition-colors"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Community Guidelines</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Learn about our community rules</p>
            </div>
          </div>
        </a>
      </div>

      {/* FAQs */}
      <div className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Common Questions</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>How do I reset my password?</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Go to Settings → Privacy & Security → Change Password</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>How do I report a user or post?</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click the three dots menu on any post or profile and select "Report"</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>How do I delete my account?</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Go to Settings → Account → Delete Account. This action is permanent.</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>How do I block someone?</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Visit their profile and click the three dots menu, then select "Block User"</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
