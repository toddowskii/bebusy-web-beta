'use client'

import Link from 'next/link'
import { Home, Users, MessageSquare, Bell, User, Target, Settings } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AppLayoutProps {
  children: React.ReactNode
  username?: string
}

export function AppLayout({ children, username }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCheckingBan, setIsCheckingBan] = useState(true)

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await (supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single() as any)
        
        if (profile?.role === 'banned') {
          console.log('AppLayout: User is banned, redirecting to /banned')
          router.push('/banned')
          return
        }
      }
      
      setIsCheckingBan(false)
    }
    
    checkBanStatus()
    
    // Check every 5 seconds
    const interval = setInterval(checkBanStatus, 5000)
    return () => clearInterval(interval)
  }, [router])

  if (isCheckingBan) {
    return null // or a loading spinner
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#000000] border-b border-[#2D2D2D] z-50">
        <div className="h-14 flex items-center justify-between" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-[#10B981]">BeBusy</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/settings/account" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
            <Link href="/notifications" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#2D2D2D] z-50">
        <div className="h-16 flex items-center justify-around" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link href="/groups" className={`flex flex-col items-center gap-1 ${isActive('/groups') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors`}>
            <Users className="w-6 h-6" />
            <span className="text-xs">Groups</span>
          </Link>
          <Link href="/focus-groups" className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/focus-groups') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors`}>
            <Target className="w-6 h-6" />
            <span className="text-xs">Focus</span>
          </Link>
          <Link href="/messages" className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/messages') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors`}>
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Messages</span>
          </Link>
          {username ? (
            <Link href={`/profile/${username}`} className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/profile') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors`}>
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#4D4D4D]">
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
