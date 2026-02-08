'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/AppLayout'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { searchUsers, searchPosts, searchGroups, searchUsersByTags } from '@/lib/supabase/search'
import { Search as SearchIcon, User, FileText, Users, X } from 'lucide-react'
import TagPicker from '@/components/TagPicker'
import { TAG_OPTIONS } from '@/lib/tagCategories'
import Link from 'next/link'
import { PostCard } from '@/components/PostCard'
import toast from 'react-hot-toast'

export default function SearchPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagQuery, setTagQuery] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'groups'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounce = setTimeout(() => {
        handleSearch()
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      setUsers([])
      setPosts([])
      setGroups([])
      setHasSearched(false)
    }
  }, [searchQuery, activeTab])
  
  useEffect(() => {
    // Run search when tags change (only for users tab)
    if (activeTab === 'users' && tagQuery.length > 0) {
      const debounce = setTimeout(() => {
        handleSearch()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [tagQuery, activeTab])

  const loadCurrentUser = async () => {
    try {
      const profile = await getCurrentProfile()
      setCurrentUser(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      if (activeTab === 'users') {
        // If user provided tags, use tag-based search
        const tags = tagQuery
        if (tags && tags.length > 0) {
          const results = await searchUsersByTags(tags, searchQuery)
          setUsers(results)
        } else {
          const results = await searchUsers(searchQuery)
          setUsers(results)
        }
      } else if (activeTab === 'posts') {
        const results = await searchPosts(searchQuery, currentUser?.id)
        setPosts(results)
      } else if (activeTab === 'groups') {
        const results = await searchGroups(searchQuery)
        setGroups(results)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setUsers([])
    setPosts([])
    setGroups([])
    setPosts([])
    setHasSearched(false)
  }

  return (
    <AppLayout username={currentUser?.username}>
      <div>
        {/* Search Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 className="text-2xl font-bold" style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Search</h1>
          
          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users or posts..."
              className="w-full rounded-full outline-none border"
              style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          {/* Tag filters (comma-separated) */}
          <div style={{ marginTop: '12px' }}>
            <TagPicker value={tagQuery} onChange={setTagQuery} options={TAG_OPTIONS} placeholder="Filter by tags (comma-separated) e.g. react, python, machine_learning" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('users')}
            className="flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', backgroundColor: activeTab === 'users' ? '#10B981' : 'var(--bg-secondary)', color: activeTab === 'users' ? '#000000' : 'var(--text-muted)' }}
            onMouseEnter={(e) => { if (activeTab !== 'users') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
            onMouseLeave={(e) => { if (activeTab !== 'users') e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
          >
            <User className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className="flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', backgroundColor: activeTab === 'groups' ? '#10B981' : 'var(--bg-secondary)', color: activeTab === 'groups' ? '#000000' : 'var(--text-muted)' }}
            onMouseEnter={(e) => { if (activeTab !== 'groups') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
            onMouseLeave={(e) => { if (activeTab !== 'groups') e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
          >
            <Users className="w-4 h-4" />
            Groups
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className="flex-1 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', backgroundColor: activeTab === 'posts' ? '#10B981' : 'var(--bg-secondary)', color: activeTab === 'posts' ? '#000000' : 'var(--text-muted)' }}
            onMouseEnter={(e) => { if (activeTab !== 'posts') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
            onMouseLeave={(e) => { if (activeTab !== 'posts') e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
          >
            <FileText className="w-4 h-4" />
            Posts
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {/* Users Results */}
            {activeTab === 'users' && (
              <div className="space-y-3">
                {users.length === 0 ? (
                  <div className="text-center p-12">
                    <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No users found</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="block rounded-[20px] border transition-all"
                      style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover ring-2"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg ring-2">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {user.full_name || user.username}
                          </h3>
                          <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
                          {user.bio && (
                            <p className="text-sm truncate mt-1" style={{ color: 'var(--text-muted)' }}>{user.bio}</p>
                          )}
                        </div>
                        {user.role && user.role !== 'user' && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Groups Results */}
            {activeTab === 'groups' && (
              <div className="space-y-3">
                {groups.length === 0 ? (
                  <div className="text-center p-12">
                    <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No groups found</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block rounded-[20px] border transition-all"
                      style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg ring-2">
                          {group.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {group.members_count || 0} members
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Posts Results */}
            {activeTab === 'posts' && (
              <div>
                {posts.length === 0 ? (
                  <div className="text-center p-12">
                    <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No posts found</p>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="text-center p-12">
            <SearchIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Search BeBusy</h3>
            <p style={{ color: 'var(--text-muted)' }}>Find users and posts</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
