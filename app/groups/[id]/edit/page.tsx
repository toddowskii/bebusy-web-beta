'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getGroup, updateGroup, deleteGroup } from '@/lib/supabase/groups'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { ArrowLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditGroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    setLoading(true)
    try {
      const [currentProfile, groupData] = await Promise.all([
        getCurrentProfile(),
        getGroup(groupId)
      ])

      if (!groupData) {
        toast.error('Group not found')
        router.push('/groups')
        return
      }

      // Check if user is the creator
      if ((groupData as any).created_by !== currentProfile?.id) {
        toast.error('Only the group creator can edit')
        router.push(`/groups/${groupId}`)
        return
      }

      setName((groupData as any).name)
      setDescription((groupData as any).description || '')
      setLoading(false)
    } catch (error) {
      console.error('Error loading group:', error)
      toast.error('Failed to load group')
      router.push('/groups')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setSaving(true)
    try {
      await updateGroup(groupId, name.trim(), description.trim())
      toast.success('Group updated!')
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone. All members will be removed and any posts in this group will be orphaned.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteGroup(groupId)
      toast.success('Group deleted!')
      router.push('/groups')
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#ECEDEE]" />
            </button>
            <h2 className="text-2xl font-bold text-[#ECEDEE]">Edit Group</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-full disabled:opacity-50 transition-all"
            style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ padding: '24px' }}>
            <h3 className="text-lg font-semibold text-[#ECEDEE]" style={{ marginBottom: '16px' }}>Group Details</h3>

            {/* Group Name */}
            <div style={{ marginBottom: '20px' }}>
              <label className="block text-sm font-medium text-[#9BA1A6]" style={{ marginBottom: '8px' }}>Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                maxLength={50}
                className="w-full bg-[#2C2C2E] text-[#ECEDEE] rounded-xl border border-[#2C2C2E] focus:border-[#10B981] focus:outline-none transition-colors placeholder:text-[#8E8E93]"
                style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
                required
              />
              <p className="text-xs text-[#8E8E93]" style={{ marginTop: '4px' }}>{name.length}/50</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#9BA1A6]" style={{ marginBottom: '8px' }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                maxLength={200}
                rows={4}
                className="w-full bg-[#2C2C2E] text-[#ECEDEE] rounded-xl border border-[#2C2C2E] focus:border-[#10B981] focus:outline-none transition-colors resize-none placeholder:text-[#8E8E93]"
                style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
              />
              <p className="text-xs text-[#8E8E93]" style={{ marginTop: '4px' }}>{description.length}/200</p>
            </div>
          </div>

          {/* Delete Section */}
          <div className="bg-[#1C1C1E] rounded-[20px] border border-[#2C2C2E]" style={{ padding: '24px' }}>
            <h3 className="text-sm font-semibold text-red-400" style={{ marginBottom: '12px' }}>Danger Zone</h3>
            <p className="text-sm text-[#8E8E93]" style={{ marginBottom: '16px' }}>
              This action cannot be undone. All members will be removed from the group.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full bg-[#2C2C2E] hover:bg-[#3C3C3E] text-red-400 hover:text-red-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-red-500/40 disabled:opacity-50"
              style={{ paddingTop: '12px', paddingBottom: '12px' }}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
