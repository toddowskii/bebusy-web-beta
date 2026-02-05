'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/supabase/groups'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setCreating(true)
    try {
      const group = await createGroup(name.trim(), description.trim(), false)
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[600px] mx-auto border-x border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800 p-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
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
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
              required
            />
            <p className="text-xs text-gray-600 mt-1">{name.length}/50</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              maxLength={200}
              rows={4}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{description.length}/200</p>
          </div>
        </form>
      </div>
    </div>
  )
}
