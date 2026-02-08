'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getTodayCheckIn, createCheckIn, completeCheckIn, getUserStreak, getStreakLeaderboard } from '@/lib/supabase/checkins'
import { AppLayout } from '@/components/AppLayout'
import { CheckCircle2, Flame, Trophy, Target, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CheckInPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [todayGoal, setTodayGoal] = useState('')
  const [yesterdayCompleted, setYesterdayCompleted] = useState('')
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const currentProfile = await getCurrentProfile()
      if (!currentProfile) {
        router.push('/login')
        return
      }
      setProfile(currentProfile)

      // Load today's check-in
      const { data: checkIn } = await getTodayCheckIn(currentProfile.id)
      setTodayCheckIn(checkIn)

      // Load streak
      const { data: streakData } = await getUserStreak(currentProfile.id)
      setStreak(streakData)

      // Load leaderboard
      const { data: leaderboardData } = await getStreakLeaderboard(5)
      setLeaderboard(leaderboardData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load check-in data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !todayGoal.trim()) return

    setIsSubmitting(true)
    try {
      const { data, error } = await createCheckIn(
        profile.id,
        todayGoal,
        yesterdayCompleted.trim() || null
      )

      if (error) throw error

      toast.success('✅ Daily check-in submitted!')
      setTodayCheckIn(data)
      setTodayGoal('')
      setYesterdayCompleted('')
      
      // Reload streak
      const { data: streakData } = await getUserStreak(profile.id)
      setStreak(streakData)
    } catch (error) {
      console.error('Error submitting check-in:', error)
      toast.error('Failed to submit check-in')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteGoal = async () => {
    if (!todayCheckIn) return

    try {
      await completeCheckIn(todayCheckIn.id)
      setTodayCheckIn({ ...todayCheckIn, is_completed: true })
      toast.success('🎉 Goal marked as completed!')
    } catch (error) {
      console.error('Error completing goal:', error)
      toast.error('Failed to mark goal as completed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppLayout username={profile?.username}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
          Daily Check-In
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{today}</p>
      </div>

      {/* Streak Card */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Current Streak</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {streak?.current_streak || 0} days
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Best Streak</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {streak?.longest_streak || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Form or Today's Goal */}
      {!todayCheckIn ? (
        <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Daily Prompts</h2>
          </div>
          
          <form onSubmit={handleSubmitCheckIn} style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                What did you finish yesterday? (Optional)
              </label>
              <textarea
                value={yesterdayCompleted}
                onChange={(e) => setYesterdayCompleted(e.target.value)}
                placeholder="Describe what you completed yesterday..."
                className="w-full rounded-xl outline-none resize-none"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  padding: '12px',
                  minHeight: '80px'
                }}
                rows={3}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                What will you work on today? *
              </label>
              <textarea
                value={todayGoal}
                onChange={(e) => setTodayGoal(e.target.value)}
                placeholder="Set your goal for today..."
                className="w-full rounded-xl outline-none resize-none"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  padding: '12px',
                  minHeight: '100px'
                }}
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !todayGoal.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg disabled:opacity-50"
              style={{ padding: '12px 24px' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Check-In'}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Today's Goal</h2>
          </div>
          
          <div style={{ padding: '20px' }}>
            {todayCheckIn.yesterday_completed && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Yesterday's Progress:</p>
                <p style={{ color: 'var(--text-primary)' }}>{todayCheckIn.yesterday_completed}</p>
              </div>
            )}

            <div className="flex items-start gap-3" style={{ marginBottom: '16px' }}>
              <Target className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)', marginTop: '2px' }} />
              <p className="text-lg" style={{ color: 'var(--text-primary)' }}>{todayCheckIn.today_goal}</p>
            </div>

            {!todayCheckIn.is_completed && (
              <button
                onClick={handleCompleteGoal}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg flex items-center justify-center gap-2"
                style={{ padding: '12px 24px' }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Mark as Completed
              </button>
            )}

            {todayCheckIn.is_completed && (
              <div className="text-center" style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <p className="font-semibold" style={{ color: 'var(--primary)' }}>Completed! 🎉</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Top Streaks</h2>
            </div>
          </div>
          
          <div style={{ padding: '12px' }}>
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg transition-colors"
                style={{ padding: '12px', marginBottom: index < leaderboard.length - 1 ? '8px' : '0' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: 'var(--text-muted)', width: '24px' }}>
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {user.profiles?.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user.profiles?.full_name || 'User'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      @{user.profiles?.username || 'user'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {user.current_streak}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
