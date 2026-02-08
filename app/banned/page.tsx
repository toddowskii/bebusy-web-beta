'use client'

import { Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function BannedPage() {
  const router = useRouter()

  // Prevent navigation away from this page
  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await (supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single() as any)

      // If no longer banned, redirect to home
      if (profile?.role !== 'banned') {
        router.push('/')
      }
    }

    checkBanStatus()

    // Check ban status every 5 seconds
    const interval = setInterval(checkBanStatus, 5000)

    return () => clearInterval(interval)
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" style={{ padding: '20px' }}>
      <div className="max-w-md w-full">
        {/* Ban Icon */}
        <div className="flex justify-center" style={{ marginBottom: '48px' }}>
          <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
            <Ban className="w-16 h-16 text-red-500" />
          </div>
        </div>
        
        {/* Main Card */}
        <div className="bg-card rounded-[24px] border border-border overflow-hidden" style={{ marginBottom: '20px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-b border-red-500/20" style={{ padding: '32px 24px' }}>
            <h1 className="text-3xl font-bold text-foreground mb-3 text-center">Account Suspended</h1>
            <p className="text-muted-foreground text-center leading-relaxed">
              Your account has been temporarily or permanently suspended due to violation of our community guidelines.
            </p>
          </div>
          
          {/* Appeal Section */}
          <div style={{ padding: '24px' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-lg">?</span>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-2">Believe this is a mistake?</h3>
                <p className="text-sm text-muted leading-relaxed">
                  If you think your account was banned in error, you can submit an appeal to our support team.
                </p>
              </div>
            </div>
            
            <a
              href="mailto:appeals@bebusy.app?subject=Account%20Ban%20Appeal&body=Please%20explain%20why%20you%20believe%20your%20account%20was%20banned%20in%20error."
              className="flex items-center justify-center gap-2 w-full font-semibold rounded-xl transition-all bg-primary hover:bg-primary-hover text-white"
              style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '20px', paddingRight: '20px', marginTop: '16px' }}
            >
              Submit Appeal
            </a>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full font-semibold rounded-xl transition-all bg-card hover:bg-muted border border-border text-foreground"
          style={{ paddingTop: '14px', paddingBottom: '14px' }}
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
