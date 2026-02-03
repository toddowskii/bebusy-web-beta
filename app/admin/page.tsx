'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAdmin, getAllUsers, updateUserRole, banUser, unbanUser } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { fetchFocusGroups } from '@/lib/supabase/focusgroups'
import { Shield, Users, Target, Plus, Edit, Ban, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'focus-groups'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [focusGroups, setFocusGroups] = useState<any[]>([])
  const [showCreateFocusGroup, setShowCreateFocusGroup] = useState(false)

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
      const [usersData, focusGroupsData] = await Promise.all([
        getAllUsers(),
        fetchFocusGroups()
      ])
      setUsers(usersData)
      setFocusGroups(focusGroupsData)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400">Manage users and focus groups</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-green-500 text-green-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('focus-groups')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'focus-groups'
                ? 'border-green-500 text-green-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-5 h-5" />
            Focus Groups ({focusGroups.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Username</th>
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">Posts</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                            {user.full_name?.[0] || '?'}
                          </div>
                        )}
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{user.email}</td>
                    <td className="p-4 text-gray-400">@{user.username || 'N/A'}</td>
                    <td className="p-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                        disabled={user.role === 'banned'}
                      >
                        <option value="user">User</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                        <option value="banned">Banned</option>
                      </select>
                      {user.role === 'banned' && user.banned_until && (
                        <div className="text-xs text-yellow-500 mt-1">
                          Until: {new Date(user.banned_until).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">{user.posts_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="text-green-500 hover:text-green-400 text-sm font-medium"
                        >
                          View
                        </button>
                        {user.role === 'banned' ? (
                          <button
                            onClick={() => handleUnbanUser(user.id, user.username)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id, user.username)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
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
        )}

        {/* Focus Groups Tab */}
        {activeTab === 'focus-groups' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => router.push('/admin/create-focus-group')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-green-500/20"
              >
                <Plus className="w-5 h-5" />
                Create Focus Group
              </button>
            </div>

            <div className="grid gap-4">
              {focusGroups.map((fg) => (
                <div
                  key={fg.id}
                  className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{fg.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{fg.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Mentor: {fg.mentor_name}</span>
                        <span>•</span>
                        <span>
                          {fg.total_spots - fg.available_spots}/{fg.total_spots} spots filled
                        </span>
                        <span>•</span>
                        <span className={fg.is_full ? 'text-yellow-500' : 'text-green-500'}>
                          {fg.is_full ? 'Full' : `${fg.available_spots} available`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/edit-focus-group/${fg.id}`)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  {(fg.start_date || fg.end_date) && (
                    <div className="text-sm text-gray-500">
                      Duration: {new Date(fg.start_date).toLocaleDateString()} -{' '}
                      {new Date(fg.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}

              {focusGroups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No focus groups created yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
