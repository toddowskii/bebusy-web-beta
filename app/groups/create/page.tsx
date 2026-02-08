'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/supabase/groups'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import TagPicker from '@/components/TagPicker'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setCreating(true)
    try {
      const group = await createGroup(name.trim(), description.trim(), false, selectedTags)
      const groupId = (group as any)?.id

      if (!groupId) {
        toast.error('Group created but could not load it')
        router.push('/groups')
        return
      }

      toast.success('Group created!')
      router.push(`/groups/${groupId}`)
    } catch (error) {
      const err = error as any
      const message = err?.message || err?.error_description || err?.details || err?.hint
      console.error('Error creating group:', message || err, err)
      toast.error(message || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-[600px] mx-auto border-x" style={{ borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-md border-b p-4 z-10 flex items-center justify-between" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', borderColor: 'var(--border)', paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Create Group</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={creating || !name.trim()}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-green-500/20"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              className="w-full px-4 py-3 rounded-lg border focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{name.length}/50</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              maxLength={200}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Tags</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
          </div>
        </form>
      </div>
    </div>
  )
}
