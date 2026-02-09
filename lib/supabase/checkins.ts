import { supabase } from './client'
import { Database } from '@/types/database.types'

type DailyCheckIn = Database['public']['Tables']['daily_check_ins']['Row']
type UserStreak = Database['public']['Tables']['user_streaks']['Row']

// Get today's check-in
export async function getTodayCheckIn(userId: string): Promise<{ data: DailyCheckIn | null; error: any | null }> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      if (error.code === '42P01') {
        console.warn('daily_check_ins table does not exist. Please run the migration.')
        return { data: null, error: null }
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching today check-in:', error)
    return { data: null, error: null }
  }
}

// Create daily check-in
export async function createCheckIn(
  userId: string,
  todayGoal: string,
  yesterdayCompleted: string | null = null,
  groupId: string | null = null
) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await (supabase as any)
      .from('daily_check_ins')
      .insert({
        user_id: userId,
        group_id: groupId,
        today_goal: todayGoal,
        yesterday_completed: yesterdayCompleted,
        date: today,
        is_completed: false
      })
      .select()
      .single()

    if (error) throw error

    // Update streak
    await updateStreak(userId)

    return { data, error: null }
  } catch (error) {
    console.error('Error creating check-in:', error)
    return { data: null, error }
  }
}

// Update check-in as completed
export async function completeCheckIn(checkInId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('daily_check_ins')
      .update({ is_completed: true })
      .eq('id', checkInId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error completing check-in:', error)
    return { data: null, error }
  }
}

// Get user's check-in history
export async function getUserCheckIns(userId: string, limit: number = 30) {
  try {
    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user check-ins:', error)
    return { data: null, error }
  }
}

// Get group's check-ins for today
export async function getGroupCheckIns(groupId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_check_ins')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .eq('date', today)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching group check-ins:', error)
    return { data: null, error }
  }
}

// Get user streak
export async function getUserStreak(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      if (error.code === '42P01') {
        console.warn('user_streaks table does not exist. Please run the migration.')
        return { data: null, error: null }
      }
      throw error
    }
    
    // If no streak exists, create one
    if (!data) {
      const { data: newStreak, error: createError } = await (supabase as any)
        .from('user_streaks')
        .insert({ user_id: userId, current_streak: 0, longest_streak: 0 })
        .select()
        .single()

      if (createError) throw createError
      return { data: newStreak, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user streak:', error)
    return { data: null, error: null }
  }
}

// Update user streak
export async function updateStreak(userId: string) {
  try {
    const { data: streak, error: streakError } = await getUserStreak(userId)
    if (streakError || !streak) return

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    let newStreak = 1
    let longestStreak = streak.longest_streak

    // Check if last check-in was yesterday
    if (streak.last_check_in_date === yesterday) {
      newStreak = streak.current_streak + 1
    } else if (streak.last_check_in_date === today) {
      // Already checked in today
      return
    }

    // Update longest streak if needed
    if (newStreak > longestStreak) {
      longestStreak = newStreak
    }

    const { error } = await (supabase as any)
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_check_in_date: today
      })
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating streak:', error)
  }
}

// Get leaderboard (top streaks)
export async function getStreakLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('current_streak', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01') {
        console.warn('user_streaks table does not exist. Please run the migration.')
        return { data: [], error: null }
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return { data: [], error: null }
  }
}
