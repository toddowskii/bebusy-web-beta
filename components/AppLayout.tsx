'use client'

import Link from 'next/link'
import { Home, Users, MessageSquare, Bell, User, Target, Settings, Search, Shield, Award } from 'lucide-react'
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUserId(session.user.id)
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
        
        setUserRole(profile?.role || null)
      }
      
      setIsCheckingBan(false)
    }
    
    checkBanStatus()
    
    // Check every 5 seconds
    const interval = setInterval(checkBanStatus, 5000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)

      setUnreadCount(count || 0)

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      setUnreadNotifCount(notifCount || 0)
    }

    fetchUnreadCount()

    // Subscribe to message changes for this user
    const messagesChannel = supabase
      .channel('unread-messages-app')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message change detected:', payload)
          fetchUnreadCount()
        }
      )
      .subscribe()

    // Subscribe to notification changes for this user
    const notifsChannel = supabase
      .channel('unread-notifications-app')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change detected:', payload)
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notifsChannel)
    }
  }, [userId])

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
            <Link href="/search" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Search className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
            {(userRole === 'mentor' || userRole === 'admin') && (
              <Link 
                href="/mentor" 
                className="p-2 hover:bg-[#151718] rounded-lg transition-colors" 
                title="Mentor Dashboard"
              >
                <Award className="w-5 h-5 text-[#10B981]" />
              </Link>
            )}
            {userRole === 'admin' && (
              <Link 
                href="/admin" 
                className="p-2 hover:bg-[#151718] rounded-lg transition-colors" 
                title="Admin Dashboard"
              >
                <Shield className="w-5 h-5 text-purple-500" />
              </Link>
            )}
            <Link href="/settings/account" className="p-2 hover:bg-[#151718] rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-[#9BA1A6]" />
            </Link>
            <Link href="/notifications" className="p-2 hover:bg-[#151718] rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-[#9BA1A6]" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#10B981] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
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
          <Link href="/messages" className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/messages') ? 'text-[#10B981]' : 'text-[#9BA1A6] hover:text-[#ECEDEE]'} transition-colors relative`}>
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#10B981] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
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
