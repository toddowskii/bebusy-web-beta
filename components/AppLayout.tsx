'use client'

import Link from 'next/link'
import { Home, Users, MessageSquare, Bell, User, Target, Settings, Search, Shield, Award, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="h-14 flex items-center justify-between" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>BeBusy</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </Link>
            <Link href="/check-in" className="p-2 rounded-lg transition-colors" title="Daily Check-in" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </Link>
            {(userRole === 'mentor' || userRole === 'admin') && (
              <Link 
                href="/mentor" 
                className="p-2 rounded-lg transition-colors" 
                title="Mentor Dashboard"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Award className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </Link>
            )}
            {userRole === 'admin' && (
              <Link 
                href="/admin" 
                className="p-2 rounded-lg transition-colors" 
                title="Admin Dashboard"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Shield className="w-5 h-5 text-purple-500" />
              </Link>
            )}
            <Link href="/settings/account" className="p-2 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Settings className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </Link>
            <Link href="/notifications" className="p-2 rounded-lg transition-colors relative" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ backgroundColor: 'var(--primary)' }}>
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
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
        <div className="h-16 flex items-center justify-around" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <Link href="/" className="flex flex-col items-center gap-1 transition-colors" style={{ color: isActive('/') ? 'var(--primary)' : 'var(--text-secondary)' }}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link href="/groups" className="flex flex-col items-center gap-1 transition-colors" style={{ color: isActive('/groups') ? 'var(--primary)' : 'var(--text-secondary)' }}>
            <Users className="w-6 h-6" />
            <span className="text-xs">Groups</span>
          </Link>
          <Link href="/focus-groups" className="flex flex-col items-center gap-1 transition-colors" style={{ color: pathname?.startsWith('/focus-groups') ? 'var(--primary)' : 'var(--text-secondary)' }}>
            <Target className="w-6 h-6" />
            <span className="text-xs">Focus</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center gap-1 transition-colors relative" style={{ color: pathname?.startsWith('/messages') ? 'var(--primary)' : 'var(--text-secondary)' }}>
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ backgroundColor: 'var(--primary)' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs">Messages</span>
          </Link>
          {username ? (
            <Link href={`/profile/${username}`} className="flex flex-col items-center gap-1 transition-colors" style={{ color: pathname?.startsWith('/profile') ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
