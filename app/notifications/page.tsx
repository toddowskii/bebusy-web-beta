'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/supabase/notifications'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase/client'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Separate useEffect for real-time subscription
  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel('notifications-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new notification with joins
            loadData()
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? { ...n, is_read: payload.new.is_read } : n))
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      const userProfile = await getCurrentProfile()
      setProfile(userProfile)
      
      const notifs = await getNotifications()
      setNotifications(notifs)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistically update UI
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      
      // Update database
      await markAllAsRead()
      
      toast.success('All marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
      // Reload on error
      loadData()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500 fill-current" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationText = (notification: any) => {
    const user = notification.profiles
    const username = user?.full_name || user?.username || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return `${username} liked your post`
      case 'comment':
        return `${username} commented on your post`
      case 'follow':
        return `${username} started following you`
      default:
        return 'New notification'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppLayout username={profile?.username}>
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-card rounded-[20px] border border-border p-12 text-center">
          <Bell className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No notifications yet</h3>
          <p className="text-muted-foreground">When you get notifications, they'll show up here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) {
                  handleMarkAsRead(notification.id)
                }
                // Navigate based on notification type
                if (notification.type === 'like' || notification.type === 'comment') {
                  if (notification.related_id) {
                    router.push(`/post/${notification.related_id}`)
                  }
                } else if (notification.type === 'follow') {
                  if (notification.profiles?.username) {
                    router.push(`/profile/${notification.profiles.username}`)
                  }
                }
              }}
              className={`bg-card rounded-[20px] border hover:bg-card-hover transition-all cursor-pointer ${
                !notification.is_read ? 'border-primary/40' : 'border-border'
              }`}
              style={{ paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {notification.profiles?.avatar_url ? (
                  <img
                    src={notification.profiles.avatar_url}
                    alt={notification.profiles.username || 'User'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {notification.profiles?.username?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    <span className="font-semibold">
                      {notification.profiles?.full_name || notification.profiles?.username || 'Someone'}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {notification.type === 'like' && 'liked your post'}
                      {notification.type === 'comment' && 'commented on your post'}
                      {notification.type === 'follow' && 'started following you'}
                    </span>
                  </p>

                  {notification.posts?.content && (
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                      "{notification.posts.content}"
                    </p>
                  )}

                  <p className="text-muted text-sm mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
