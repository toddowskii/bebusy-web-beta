'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isMentor, getMentorFocusGroups } from '@/lib/supabase/mentor'
import { Plus, Users, Calendar, Edit, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'
import { getCurrentProfile } from '@/lib/supabase/profiles'

export default function MentorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [focusGroups, setFocusGroups] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkMentorAndLoadData()
  }, [])

  const checkMentorAndLoadData = async () => {
    try {
      const mentor = await isMentor()
      if (!mentor) {
        toast.error('Access denied: Mentors only')
        router.push('/')
        return
      }

      const [groups, currentProfile] = await Promise.all([
        getMentorFocusGroups(),
        getCurrentProfile()
      ])
      setFocusGroups(groups)
      setProfile(currentProfile)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AppLayout username={profile?.username}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ marginBottom: '24px' }}>
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
            <Award className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Mentor Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage your focus groups</p>
        </div>

        <Link
          href="/mentor/create-focus-group"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold transition-colors shadow-lg"
          style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}
        >
          <Plus className="w-5 h-5" />
          Create Focus Group
        </Link>
      </div>

      {/* Focus Groups */}
      <div className="bg-card rounded-[20px] border border-border">
        <div className="border-b border-border" style={{ padding: '24px' }}>
          <h2 className="text-xl font-bold text-foreground">My Focus Groups</h2>
          <p className="text-muted-foreground text-sm" style={{ marginTop: '4px' }}>
            {focusGroups.length} focus group{focusGroups.length !== 1 ? 's' : ''}
          </p>
        </div>

        {focusGroups.length === 0 ? (
          <div className="text-center" style={{ padding: '48px' }}>
            <div className="text-5xl" style={{ marginBottom: '16px' }}>🎯</div>
            <h3 className="text-xl font-semibold text-foreground" style={{ marginBottom: '8px' }}>No focus groups yet</h3>
            <p className="text-muted-foreground" style={{ marginBottom: '24px' }}>Create your first focus group to start mentoring</p>
            <Link
              href="/mentor/create-focus-group"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold transition-colors"
              style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '12px', paddingBottom: '12px' }}
            >
              <Plus className="w-5 h-5" />
              Create Focus Group
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ padding: '24px' }}>
            {focusGroups.map((group) => (
              <div
                key={group.id}
                className="bg-background border border-border rounded-[20px] hover:border-primary/50 transition-all"
                style={{ padding: '24px' }}
              >
                <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground" style={{ marginBottom: '8px' }}>{group.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{group.description}</p>
                  </div>
                  <Link
                    href={`/mentor/edit-focus-group/${group.id}`}
                    className="p-2 hover:bg-card rounded-lg transition-colors text-primary"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted" />
                    <span className="text-muted-foreground">
                      {group.current_members} / {group.total_spots} members
                    </span>
                    {group.current_members >= group.total_spots && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 rounded-full" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}>
                        Full
                      </span>
                    )}
                  </div>

                  {(group.start_date || group.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-muted" />
                      <span>
                        {group.start_date && new Date(group.start_date).toLocaleDateString()}
                        {group.start_date && group.end_date && ' - '}
                        {group.end_date && new Date(group.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border" style={{ marginTop: '16px', paddingTop: '16px' }}>
                  <div className="text-xs text-muted">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
