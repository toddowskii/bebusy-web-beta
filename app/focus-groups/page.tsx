'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchFocusGroups, fetchUserFocusGroups } from '@/lib/supabase/focusgroups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { Target, Users, Calendar, Clock, Compass, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import TagPicker from '@/components/TagPicker'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import { AppLayout } from '@/components/AppLayout'

export default function FocusGroupsPage() {
  const router = useRouter()
  const [allFocusGroups, setAllFocusGroups] = useState<any[]>([])
  const [userFocusGroups, setUserFocusGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'explore' | 'yours'>('explore')
  const [filterTags, setFilterTags] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [filterTags])

  const loadData = async () => {
    setLoading(true)
    try {
      const [allData, userData, userProfile] = await Promise.all([
        fetchFocusGroups(filterTags),
        fetchUserFocusGroups(filterTags),
        getCurrentProfile()
      ])
      setAllFocusGroups(allData)
      setUserFocusGroups(userData)
      setProfile(userProfile)

      // If user is not logged in and the active tab is 'yours', switch to explore
      if (!userProfile && activeTab === 'yours') {
        setActiveTab('explore')
      }
    } catch (error) {
      console.error('Error loading focus groups:', error)
      toast.error('Failed to load focus groups')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const focusGroups = activeTab === 'explore' ? allFocusGroups : userFocusGroups
  const filtered = focusGroups.filter(fg => {
    if (!filterTags || filterTags.length === 0) return true
    const tags = fg.tags || []
    return filterTags.some(t => tags.includes(t))
  })

  return (
    <AppLayout username={profile?.username}>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Focus Groups & Challenges</h2>
        <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Join exclusive mentorship programs</p>
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
          onClick={() => {
            if (profile) setActiveTab('yours')
            else router.push('/login')
          }}
          className={`flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'yours'
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : profile ? '' : 'opacity-60 cursor-not-allowed'
          }`}
          style={activeTab !== 'yours' ? { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', color: profile ? 'var(--text-muted)' : 'var(--text-muted)', backgroundColor: profile ? 'var(--bg-secondary)' : 'transparent' } : { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <UserCircle2 className="w-4 h-4" />
          {profile ? 'Your Groups' : 'Your Groups (Sign in)'}
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '16px' }}>
        <TagPicker value={filterTags} onChange={setFilterTags} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
      </div>

      {/* Focus Groups List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4" style={{ color: '#2D2D2D' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'explore' ? 'No focus groups available' : 'Not in any focus groups'}
          </h3>
          <p className="text-[#9BA1A6]">
            {activeTab === 'explore' ? 'Check back soon for new opportunities!' : 'Join a focus group to get started!'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((fg) => (
            <Link
              key={fg.id}
              href={`/focus-groups/${fg.id}`}
              className="block"
              style={{ marginBottom: '20px' }}
            >
              <div className="rounded-[20px] border hover:bg-[#252527] transition-all cursor-pointer" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                <div className="flex items-start" style={{ gap: '20px' }}>
                  {/* Mentor Avatar */}
                  {fg.mentor_image_url ? (
                    <img
                      src={fg.mentor_image_url}
                      alt={fg.mentor_name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-[#10B981]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-[#10B981]">
                      {fg.mentor_name[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>{fg.title}</h3>
                    <p className="text-sm line-clamp-2" style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>{fg.description}</p>
                    
                    {/* Mentor Info */}
                    <div className="flex items-center" style={{ gap: '8px', marginBottom: '16px' }}>
                      <span className="text-sm font-medium text-[#10B981]">{fg.mentor_name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{fg.mentor_role}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center text-sm" style={{ gap: '16px', color: 'var(--text-muted)' }}>
                      <div className="flex items-center" style={{ gap: '6px' }}>
                        <Users className="w-4 h-4" />
                        <span>{fg.total_spots - fg.available_spots}/{fg.total_spots} spots filled</span>
                      </div>
                      {fg.start_date && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <div className="flex items-center" style={{ gap: '6px' }}>
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(fg.start_date)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Status Badge */}
                    {fg.is_full ? (
                      <div className="inline-flex items-center rounded-full text-xs font-medium" style={{ gap: '6px', marginTop: '16px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                        <Clock className="w-3.5 h-3.5" />
                        Waitlist Available
                      </div>
                    ) : (
                      <div className="inline-flex items-center rounded-full text-xs font-medium" style={{ gap: '6px', marginTop: '16px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <Target className="w-3.5 h-3.5" />
                        {fg.available_spots} spots available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
