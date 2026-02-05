'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdmin, getAllUsers, updateUserRole, banUser, unbanUser } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { fetchFocusGroups } from '@/lib/supabase/focusgroups'
import { Shield, Users, Target, Plus, Edit, Ban, UserCheck, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'focus-groups'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [focusGroups, setFocusGroups] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkAdminAndLoadData()
    
    // Check for expired bans every minute
    const interval = setInterval(async () => {
      const { checkExpiredBans } = await import('@/lib/supabase/admin')
      await checkExpiredBans()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const checkAdminAndLoadData = async () => {
    setLoading(true)
    const adminStatus = await isAdmin()
    
    if (!adminStatus) {
      toast.error('Access denied - Admin only')
      router.push('/')
      return
    }

    try {
      const [usersData, focusGroupsData, currentProfile] = await Promise.all([
        getAllUsers(),
        fetchFocusGroups(),
        getCurrentProfile()
      ])
      setUsers(usersData)
      setFocusGroups(focusGroupsData)
      setProfile(currentProfile)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole)
      toast.success('Role updated successfully')
      await checkAdminAndLoadData()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  const handleBanUser = async (userId: string, username: string) => {
    const reason = prompt(`Enter reason for banning @${username}:`)
    if (reason === null) return // User cancelled
    
    const durationInput = prompt(
      `Enter timeout duration:\n` +
      `- "1h" for 1 hour\n` +
      `- "24h" for 24 hours\n` +
      `- "7d" for 7 days\n` +
      `- "30d" for 30 days\n` +
      `- Leave empty for permanent ban`
    )
    
    if (durationInput === null) return // User cancelled
    
    let durationHours: number | undefined
    if (durationInput.trim()) {
      const match = durationInput.match(/^(\d+)(h|d)$/)
      if (!match) {
        toast.error('Invalid duration format. Use format like "24h" or "7d"')
        return
      }
      const [, amount, unit] = match
      durationHours = unit === 'h' ? parseInt(amount) : parseInt(amount) * 24
    }
    
    const banType = durationHours ? `${durationInput} timeout` : 'permanent ban'
    const confirmed = confirm(`Are you sure you want to give @${username} a ${banType}?`)
    if (!confirmed) return

    try {
      await banUser(userId, reason, durationHours)
      try {
        toast.success(`User @${username} has been banned`)
      } catch (e) {
        console.log(`User @${username} has been banned`)
      }
      await checkAdminAndLoadData()
    } catch (error) {
      console.error('Error banning user:', error)
      try {
        toast.error('Failed to ban user')
      } catch (e) {
        console.error('Failed to ban user')
      }
    }
  }

  const handleUnbanUser = async (userId: string, username: string) => {
    const confirmed = confirm(`Are you sure you want to unban @${username}?`)
    if (!confirmed) return

    try {
      await unbanUser(userId)
      try {
        toast.success(`User @${username} has been unbanned`)
      } catch (e) {
        console.log(`User @${username} has been unbanned`)
      }
      await checkAdminAndLoadData()
    } catch (error) {
      console.error('Error unbanning user:', error)
      try {
        toast.error('Failed to unban user')
      } catch (e) {
        console.error('Failed to unban user')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AppLayout username={profile?.username}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
          <Shield className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-[#ECEDEE]">Admin Dashboard</h1>
        </div>
        <p className="text-[#9BA1A6]">Manage users and focus groups</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#2C2C2E]" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-[#10B981] text-[#10B981]'
              : 'border-transparent text-[#9BA1A6] hover:text-[#ECEDEE]'
          }`}
          style={{ paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Users className="w-5 h-5" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('focus-groups')}
          className={`flex items-center gap-2 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'focus-groups'
              ? 'border-[#10B981] text-[#10B981]'
              : 'border-transparent text-[#9BA1A6] hover:text-[#ECEDEE]'
          }`}
          style={{ paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Target className="w-5 h-5" />
          Focus Groups ({focusGroups.length})
        </button>
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 py-3 font-medium transition-colors border-b-2 border-transparent text-[#9BA1A6] hover:text-[#ECEDEE]"
          style={{ paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Flag className="w-5 h-5" />
          Reports
        </Link>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2C2C2E]">
                <tr>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>User</th>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>Email</th>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>Username</th>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>Role</th>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>Posts</th>
                  <th className="text-left font-semibold text-[#ECEDEE]" style={{ padding: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[#2C2C2E] hover:bg-[#252527]">
                    <td style={{ padding: '16px' }}>
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                            {user.full_name?.[0] || '?'}
                          </div>
                        )}
                        <span className="font-medium text-[#ECEDEE]">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="text-[#9BA1A6]" style={{ padding: '16px' }}>{user.email}</td>
                    <td className="text-[#9BA1A6]" style={{ padding: '16px' }}>@{user.username || 'N/A'}</td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg text-[#ECEDEE] text-sm focus:outline-none focus:border-[#10B981]"
                        style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
                        disabled={user.role === 'banned'}
                      >
                        <option value="user">User</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                        <option value="banned">Banned</option>
                      </select>
                      {user.role === 'banned' && user.banned_until && (
                        <div className="text-xs text-yellow-500" style={{ marginTop: '4px' }}>
                          Until: {new Date(user.banned_until).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="text-[#9BA1A6]" style={{ padding: '16px' }}>{user.posts_count}</td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="text-[#10B981] hover:text-[#059669] text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                        {user.role === 'banned' ? (
                          <button
                            onClick={() => handleUnbanUser(user.id, user.username)}
                            className="flex items-center gap-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-medium transition-colors text-sm"
                            style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
                          >
                            <UserCheck className="w-4 h-4" />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id, user.username)}
                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors text-sm"
                            style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
                          >
                            <Ban className="w-4 h-4" />
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Focus Groups Tab */}
      {activeTab === 'focus-groups' && (
        <div>
          <div className="flex justify-end" style={{ marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/admin/create-focus-group')}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-semibold transition-colors shadow-lg"
              style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}
            >
              <Plus className="w-5 h-5" />
              Create Focus Group
            </button>
          </div>

          <div className="space-y-4">
            {focusGroups.map((fg) => (
              <div
                key={fg.id}
                className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] hover:bg-[#252527] transition-all"
                style={{ padding: '24px' }}
              >
                <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#ECEDEE]" style={{ marginBottom: '8px' }}>{fg.title}</h3>
                    <p className="text-[#9BA1A6] text-sm" style={{ marginBottom: '12px' }}>{fg.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[#8E8E93]">
                      <span>Mentor: <span className="text-[#10B981]">{fg.mentor_name}</span></span>
                      <span>•</span>
                      <span>
                        {fg.total_spots - fg.available_spots}/{fg.total_spots} spots filled
                      </span>
                      <span>•</span>
                      <span className={fg.is_full ? 'text-yellow-500' : 'text-[#10B981]'}>
                        {fg.is_full ? 'Full' : `${fg.available_spots} available`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/edit-focus-group/${fg.id}`)}
                    className="p-2 hover:bg-[#2C2C2E] rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-[#9BA1A6]" />
                  </button>
                </div>
                {(fg.start_date || fg.end_date) && (
                  <div className="text-sm text-[#8E8E93]">
                    Duration: {new Date(fg.start_date).toLocaleDateString()} -{' '}
                    {new Date(fg.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}

            {focusGroups.length === 0 && (
              <div className="text-center bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ padding: '48px' }}>
                <Target className="w-16 h-16 mx-auto text-[#3C3C3E]" style={{ marginBottom: '16px' }} />
                <p className="text-[#9BA1A6]">No focus groups created yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
