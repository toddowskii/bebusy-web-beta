'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchGroups, fetchUserGroups } from '@/lib/supabase/groups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { Users, Plus, Compass, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import TagPicker from '@/components/TagPicker'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import { AppLayout } from '@/components/AppLayout'

export default function GroupsPage() {
  const router = useRouter()
  const [allGroups, setAllGroups] = useState<any[]>([])
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'explore' | 'yours'>('explore')
  const [filterTags, setFilterTags] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // refetch when filter changes
    loadData()
  }, [filterTags])

  const loadData = async () => {
    setLoading(true)
    try {
      const [allData, userData, userProfile] = await Promise.all([
        fetchGroups(filterTags),
        fetchUserGroups(),
        getCurrentProfile()
      ])
      setAllGroups(allData)
      setUserGroups(userData)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Failed to load groups')
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

  const groups = activeTab === 'explore' ? allGroups : userGroups
  const filteredGroups = groups.filter(g => {
    if (!filterTags || filterTags.length === 0) return true
    const tags = g.tags || []
    return filterTags.some(t => tags.includes(t))
  })

  return (
    <AppLayout username={profile?.username}>
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Groups</h1>
        <Link
          href="/groups/create"
          className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          style={{ boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
        >
          <Plus className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'explore'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : ''
          }`}
          style={activeTab !== 'explore' ? { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' } : { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <Compass className="w-4 h-4" />
          Explore
        </button>
        <button
          onClick={() => setActiveTab('yours')}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'yours'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : ''
          }`}
          style={activeTab !== 'yours' ? { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' } : { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <UserCircle2 className="w-4 h-4" />
          Your Groups
        </button>
      </div>

      {/* Groups List */}
      <div style={{ marginBottom: '16px' }}>
        <TagPicker value={filterTags} onChange={setFilterTags} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
      </div>
      <div>
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'explore' ? 'No groups yet' : 'Not in any groups'}
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'explore' ? 'Create the first group to get started!' : 'Join a group to get started!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block rounded-[20px] border hover:border-[#10B981]/30 transition-all"
                style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 ring-2">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{group.name}</h3>
                    {group.description && (
                      <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span>{group.group_members?.length || 0} members</span>
                      <span>·</span>
                      <span>Created by @{group.profiles?.username}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
