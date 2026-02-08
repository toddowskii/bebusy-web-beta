'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getBlockedUsers, unblockUser } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, Shield, UserX } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function BlockedUsersPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

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

      const { data: blocked } = await getBlockedUsers(currentProfile.id)
      setBlockedUsers(blocked || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load blocked users')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (blockedUserId: string, username: string) => {
    if (!profile) return

    setUnblocking(blockedUserId)
    try {
      const { error } = await unblockUser(profile.id, blockedUserId)
      
      if (error) throw error
      
      setBlockedUsers(blockedUsers.filter(b => b.blocked_user_id !== blockedUserId))
      toast.success(`Unblocked @${username}`)
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error('Failed to unblock user')
    } finally {
      setUnblocking(null)
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
          href="/settings/privacy"
          className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Blocked Users</h1>
      </div>

      {/* Info */}
      <div className="rounded-[20px] border" style={{ padding: '20px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>About Blocking</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Blocked users cannot see your profile, posts, or send you messages. 
              You won't see their content either.
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Users List */}
      <div className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
            {blockedUsers.length} Blocked {blockedUsers.length === 1 ? 'User' : 'Users'}
          </h2>
        </div>
        
        {blockedUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <UserX className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No Blocked Users</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              You haven't blocked anyone yet. Blocked users will appear here.
            </p>
          </div>
        ) : (
          <div>
            {blockedUsers.map((blocked: any, index: number) => {
              const blockedProfile = blocked.blocked_profile
              
              return (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between"
                  style={{
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    borderBottom: index < blockedUsers.length - 1 ? '1px solid' : 'none',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      {blockedProfile?.avatar_url ? (
                        <Image
                          src={blockedProfile.avatar_url}
                          alt={blockedProfile.username || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-medium" style={{ color: 'var(--text-muted)' }}>
                          {blockedProfile?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {blockedProfile?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        @{blockedProfile?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleUnblock(blocked.blocked_user_id, blockedProfile?.username)}
                    disabled={unblocking === blocked.blocked_user_id}
                    className="px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  >
                    {unblocking === blocked.blocked_user_id ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
