'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMentorFocusGroup } from '@/lib/supabase/mentor'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import TagPicker from '@/components/TagPicker'
import { ArrowLeft, Calendar, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MentorCreateFocusGroupPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mentorName, setMentorName] = useState('')
  const [mentorRole, setMentorRole] = useState('')
  const [totalSpots, setTotalSpots] = useState(10)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !mentorName.trim() || !mentorRole.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      await createMentorFocusGroup({
        title: title.trim(),
        description: description.trim(),
        mentor_name: mentorName.trim(),
        mentor_role: mentorRole.trim(),
        total_spots: totalSpots,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        tags: selectedTags,
      })

      toast.success('Focus group created successfully!')
      router.push('/mentor')
    } catch (error) {
      console.error('Error creating focus group:', error)
      toast.error('Failed to create focus group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-[800px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Create Focus Group</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Set up a new mentorship program</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="30-Day Startup Challenge"
                maxLength={100}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{title.length}/100</p>
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
                  Your Name *
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
                  Your Role *
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

              {/* Tags */}
              <div className="rounded-lg border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Tags</label>
                <TagPicker value={selectedTags} onChange={setSelectedTags} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
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
              disabled={creating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-green-500/20"
            >
              {creating ? 'Creating...' : 'Create Focus Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
