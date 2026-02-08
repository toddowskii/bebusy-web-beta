'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { deleteUserAccount } from '@/lib/supabase/settings'
import { AppLayout } from '@/components/AppLayout'
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const currentProfile = await getCurrentProfile()
      if (!currentProfile) {
        router.push('/login')
        return
      }
      setProfile(currentProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const { error } = await deleteUserAccount(profile.id)
      
      if (error) throw error
      
      toast.success('Account deleted successfully')
      router.push('/login')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please contact support.')
      setDeleting(false)
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
          href="/settings/account"
          className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Delete Account</h1>
      </div>

      {/* Warning */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-[20px]" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" style={{ marginTop: '2px' }} />
          <div>
            <h3 className="font-semibold text-red-500 mb-2">Warning: This action is permanent</h3>
            <p className="text-sm text-red-400">
              Deleting your account will permanently remove all your data and cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* What will be deleted */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>What will be deleted</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile Information</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your username, bio, avatar, and all profile data</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Posts & Comments</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All your posts, comments, and likes</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Messages</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All your conversations and messages</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Groups & Memberships</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your group memberships and created groups</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Connections</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your followers and following relationships</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Badges & Achievements</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All earned badges and progress</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Before you go */}
      <div className="rounded-[20px] border overflow-hidden" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="border-b" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Before you go</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <p className="mb-3" style={{ color: 'var(--text-primary)' }}>Consider these alternatives:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <span style={{ color: 'var(--primary)', marginTop: '4px' }}>→</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Take a break:</strong> You can log out and come back anytime
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span style={{ color: 'var(--primary)', marginTop: '4px' }}>→</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Adjust privacy:</strong> Make your profile private in Privacy Settings
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span style={{ color: 'var(--primary)', marginTop: '4px' }}>→</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Manage notifications:</strong> Turn off notifications that bother you
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => setShowConfirmModal(true)}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        style={{ padding: '16px' }}
      >
        <Trash2 className="w-5 h-5" />
        Delete My Account
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ padding: '20px' }}>
          <div className="rounded-[20px] border w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="border-b" style={{ padding: '20px', borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Confirm Account Deletion</h2>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm">
                  This will permanently delete your account and all associated data. 
                  This action cannot be undone.
                </p>
              </div>

              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="Type DELETE"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmText('')
                  }}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
