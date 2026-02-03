'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateFocusGroup, deleteFocusGroup } from '@/lib/supabase/admin'
import { getFocusGroup } from '@/lib/supabase/focusgroups'
import { ArrowLeft, Calendar, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditFocusGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mentorName, setMentorName] = useState('')
  const [mentorRole, setMentorRole] = useState('')
  const [totalSpots, setTotalSpots] = useState(10)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadFocusGroup()
  }, [params.id])

  const loadFocusGroup = async () => {
    try {
      const group = await getFocusGroup(params.id)
      if (!group) {
        toast.error('Focus group not found')
        router.push('/admin')
        return
      }

      setTitle((group as any).title)
      setDescription((group as any).description || '')
      setMentorName((group as any).mentor_name || '')
      setMentorRole((group as any).mentor_role || '')
      setTotalSpots((group as any).total_spots)
      setStartDate((group as any).start_date || '')
      setEndDate((group as any).end_date || '')
    } catch (error) {
      console.error('Error loading focus group:', error)
      toast.error('Failed to load focus group')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !mentorName.trim() || !mentorRole.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setUpdating(true)
    try {
      await updateFocusGroup(params.id, {
        title: title.trim(),
        description: description.trim(),
        mentor_name: mentorName.trim(),
        mentor_role: mentorRole.trim(),
        total_spots: totalSpots,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      } as any)

      toast.success('Focus group updated successfully!')
      router.push('/admin')
    } catch (error) {
      console.error('Error updating focus group:', error)
      toast.error('Failed to update focus group')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this focus group? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteFocusGroup(params.id)
      toast.success('Focus group deleted successfully!')
      router.push('/admin')
    } catch (error) {
      console.error('Error deleting focus group:', error)
      toast.error('Failed to delete focus group')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[800px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Edit Focus Group</h1>
              <p className="text-gray-400 text-sm">Update mentorship program details</p>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 border border-red-800 text-red-500 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="30-Day Startup Challenge"
                maxLength={100}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Learn how to validate your startup idea and build an MVP in 30 days..."
                maxLength={500}
                rows={4}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Mentor Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mentor Name *
                </label>
                <input
                  type="text"
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mentor Role *
                </label>
                <input
                  type="text"
                  value={mentorRole}
                  onChange={(e) => setMentorRole(e.target.value)}
                  placeholder="Founder & CEO"
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Total Spots */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Spots *
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  value={totalSpots}
                  onChange={(e) => setTotalSpots(parseInt(e.target.value) || 0)}
                  min={1}
                  max={100}
                  className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-green-500/20"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
