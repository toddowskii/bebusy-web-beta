'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getFocusGroup, isFocusGroupMember, applyToFocusGroup, leaveFocusGroup } from '@/lib/supabase/focusgroups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { ArrowLeft, Users, Calendar, Target, Clock, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AppLayout } from '@/components/AppLayout'

export default function FocusGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const focusGroupId = params.id as string

  const [focusGroup, setFocusGroup] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [membershipStatus, setMembershipStatus] = useState<{ isMember: boolean; status: string | null }>({ isMember: false, status: null })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  useEffect(() => {
    loadFocusGroup()
  }, [focusGroupId])

  const loadFocusGroup = async () => {
    setLoading(true)
    try {
      const [currentProfile, focusGroupData, membership] = await Promise.all([
        getCurrentProfile(),
        getFocusGroup(focusGroupId),
        isFocusGroupMember(focusGroupId)
      ])

      if (!focusGroupData) {
        setLoading(false)
        toast.error('Focus group not found')
        router.push('/focus-groups')
        return
      }

      setCurrentUser(currentProfile)
      setFocusGroup(focusGroupData)
      setMembershipStatus(membership)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading focus group:', error)
      toast.error('Failed to load focus group')
      setLoading(false)
      router.push('/focus-groups')
    }
  }

  const handleApply = async () => {
    if (!currentUser) {
      toast.error('Please log in to apply')
      return
    }

    setActionLoading(true)
    try {
      const { status } = await applyToFocusGroup(focusGroupId)
      
      if (status === 'waitlist') {
        toast.success('Added to waitlist!')
      } else {
        toast.success('Successfully joined!')
      }
      
      await loadFocusGroup()
    } catch (error: any) {
      console.error('Error applying:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to apply'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    setActionLoading(true)
    setShowLeaveModal(false)
    try {
      await leaveFocusGroup(focusGroupId)
      toast.success('Left focus group')
      await loadFocusGroup()
    } catch (error) {
      console.error('Error leaving:', error)
      toast.error('Failed to leave')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!focusGroup) return null

  return (
    <AppLayout username={currentUser?.username}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="flex items-center text-[#9BA1A6] hover:text-[#FFFFFF] transition-colors" style={{ gap: '8px' }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Focus Group Info */}
      <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ padding: '32px' }}>
        {/* Mentor */}
        <div className="flex items-center" style={{ gap: '20px', marginBottom: '32px' }}>
            {focusGroup.mentor_image_url ? (
              <img
                src={focusGroup.mentor_image_url}
                alt={focusGroup.mentor_name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-[#10B981]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl ring-2 ring-[#10B981]">
                {focusGroup.mentor_name[0]}
              </div>
            )}
            <div>
              <p className="text-sm text-[#8E8E93]" style={{ marginBottom: '4px' }}>Mentor</p>
              <h3 className="text-xl font-bold text-[#10B981]">{focusGroup.mentor_name}</h3>
              <p className="text-sm text-[#9BA1A6]">{focusGroup.mentor_role}</p>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-bold text-[#FFFFFF]" style={{ marginBottom: '16px' }}>{focusGroup.title}</h1>
          <p className="text-[#ECEDEE] leading-relaxed" style={{ marginBottom: '32px' }}>{focusGroup.description}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
            <div className="bg-[#1C1C1E] rounded-[12px]" style={{ padding: '20px' }}>
              <div className="flex items-center text-[#9BA1A6]" style={{ gap: '8px', marginBottom: '8px' }}>
                <Users className="w-4 h-4" />
                <span className="text-sm">Participants</span>
              </div>
              <p className="text-2xl font-bold text-[#FFFFFF]">{focusGroup.total_spots - focusGroup.available_spots}/{focusGroup.total_spots}</p>
            </div>
            <div className="bg-[#1C1C1E] rounded-[12px]" style={{ padding: '20px' }}>
              <div className="flex items-center text-[#9BA1A6]" style={{ gap: '8px', marginBottom: '8px' }}>
                <Target className="w-4 h-4" />
                <span className="text-sm">Spots Left</span>
              </div>
              <p className="text-2xl font-bold text-[#FFFFFF]">{focusGroup.available_spots}</p>
            </div>
          </div>

          {/* Dates */}
          {(focusGroup.start_date || focusGroup.end_date) && (
            <div className="bg-[#1C1C1E] rounded-[12px]" style={{ padding: '20px', marginBottom: '24px' }}>
              <div className="flex items-center text-[#9BA1A6]" style={{ gap: '8px', marginBottom: '16px' }}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <div className="flex items-center" style={{ gap: '16px' }}>
                <div>
                  <p className="text-xs text-[#8E8E93]" style={{ marginBottom: '4px' }}>Start</p>
                  <p className="font-semibold text-[#FFFFFF]">{formatDate(focusGroup.start_date)}</p>
                </div>
                <div className="text-[#2C2C2E]">→</div>
                <div>
                  <p className="text-xs text-[#8E8E93]" style={{ marginBottom: '4px' }}>End</p>
                  <p className="font-semibold text-[#FFFFFF]">{formatDate(focusGroup.end_date)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {membershipStatus.isMember ? (
            <div className="flex items-center border rounded-[12px]" style={{ gap: '12px', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', marginBottom: '20px' }}>
              <CheckCircle className="w-5 h-5 text-[#10B981]" />
              <div className="flex-1">
                <p className="font-semibold text-[#10B981]">
                  {membershipStatus.status === 'waitlist' ? 'On Waitlist' : 'Member'}
                </p>
                <p className="text-sm text-[#9BA1A6]">
                  {membershipStatus.status === 'waitlist' 
                    ? 'You\'ll be notified when a spot opens up' 
                    : 'You have access to this focus group'}
                </p>
              </div>
            </div>
          ) : focusGroup.is_full && (
            <div className="flex items-center border rounded-[12px]" style={{ gap: '12px', padding: '16px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)', marginBottom: '20px' }}>
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-500">Full - Join Waitlist</p>
                <p className="text-sm text-[#9BA1A6]">Be notified when spots become available</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {membershipStatus.isMember ? (
            <button
              onClick={() => setShowLeaveModal(true)}
              disabled={actionLoading}
              className="w-full rounded-[12px] font-semibold border border-[#2C2C2E] hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-all"
              style={{ paddingTop: '14px', paddingBottom: '14px' }}
            >
              {actionLoading ? 'Leaving...' : 'Leave Focus Group'}
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={actionLoading}
              className="w-full rounded-[12px] font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
              style={{ paddingTop: '14px', paddingBottom: '14px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
            >
              {actionLoading 
                ? 'Applying...' 
                : focusGroup.is_full 
                  ? 'Join Waitlist' 
                  : 'Apply Now'}
            </button>
          )}
        </div>

        {/* Group Chat Link - Only visible to active members */}
        {membershipStatus.isMember && membershipStatus.status === 'active' && focusGroup.group_id && (
          <Link 
            href={`/messages/group/${focusGroup.group_id}`}
            className="block bg-gradient-to-r from-purple-500/10 to-pink-600/10 rounded-[20px] border border-purple-500/20 hover:border-purple-500/40 transition-all"
            style={{ padding: '24px', marginTop: '20px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '16px' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#FFFFFF] text-lg">Group Chat</h3>
                  <p className="text-[#9BA1A6] text-sm">Chat with other members</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#9BA1A6]" />
            </div>
          </Link>
        )}

        {/* Leave Confirmation Modal */}
        {showLeaveModal && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center" 
            style={{ zIndex: 100, padding: '20px' }}
            onClick={() => setShowLeaveModal(false)}
          >
          <div 
            className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E] w-full max-w-md"
            style={{ padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#FFFFFF]" style={{ marginBottom: '12px' }}>
              Leave Focus Group
            </h3>
            <p className="text-[#9BA1A6]" style={{ marginBottom: '28px' }}>
              Are you sure you want to leave this focus group?
            </p>
            <div className="flex" style={{ gap: '12px' }}>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 rounded-[12px] font-semibold border border-[#2C2C2E] text-[#FFFFFF] hover:bg-[#252527] transition-all"
                style={{ paddingTop: '12px', paddingBottom: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 rounded-[12px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                style={{ paddingTop: '12px', paddingBottom: '12px' }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
        )}
      </AppLayout>
  )
}
