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
    <div className="min-h-screen bg-[#000000] flex items-center justify-center" style={{ padding: '20px' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <Ban className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Account Suspended</h1>
        <p className="text-[#9BA1A6] mb-8">
          Your account has been temporarily or permanently suspended due to violation of our community guidelines.
        </p>
        
        <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] p-6 mb-6">
          <h3 className="text-[#FFFFFF] font-semibold mb-3">Believe this is a mistake?</h3>
          <p className="text-sm text-[#8E8E93] mb-4">
            If you think your account was banned in error, you can submit an appeal.
          </p>
          <a
            href="mailto:appeals@bebusy.app?subject=Account%20Ban%20Appeal&body=Please%20explain%20why%20you%20believe%20your%20account%20was%20banned%20in%20error."
            className="inline-block px-6 py-3 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-[#10B981] font-semibold rounded-full transition-colors"
          >
            Submit Appeal
          </a>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#2C2C2E] text-white font-semibold rounded-full transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
