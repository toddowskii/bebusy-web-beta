'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProfileByUsername } from '@/lib/supabase/profiles'
import { getUserPortfolio, createPortfolioProject, deletePortfolioProject, toggleFeaturedProject } from '@/lib/supabase/portfolio'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { AppLayout } from '@/components/AppLayout'
import { Plus, ExternalLink, Star, Trash2, X } from 'lucide-react'
import { categorizeTag, badgeClassForCategory } from '@/lib/tagCategories'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function PortfolioPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
  const [profile, setProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    projectUrl: '',
    technologies: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [username])

  const loadData = async () => {
    setLoading(true)
    try {
      const [userProfile, currentUserProfile] = await Promise.all([
        getProfileByUsername(username),
        getCurrentProfile()
      ])

      if (!userProfile) {
        router.push('/404')
        return
      }

      setProfile(userProfile)
      setCurrentUser(currentUserProfile)

      const { data: portfolioData } = await getUserPortfolio(userProfile.id)
      setProjects(portfolioData || [])
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newProject.title.trim()) return

    setIsSubmitting(true)
    try {
      const technologies = newProject.technologies
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const { data, error } = await createPortfolioProject(
        currentUser.id,
        newProject.title,
        newProject.description || null,
        null,
        newProject.projectUrl || null,
        technologies.length > 0 ? technologies : null
      )

      if (error) throw error

      setProjects([data, ...projects])
      setShowAddModal(false)
      setNewProject({ title: '', description: '', projectUrl: '', technologies: '' })
      toast.success('✨ Project added to portfolio!')
    } catch (error) {
      console.error('Error adding project:', error)
      toast.error('Failed to add project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await deletePortfolioProject(projectId)
      if (error) throw error

      setProjects(projects.filter(p => p.id !== projectId))
      toast.success('Project deleted')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleToggleFeatured = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await toggleFeaturedProject(projectId, !currentStatus)
      if (error) throw error

      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, is_featured: !currentStatus } : p
      ))
      toast.success(!currentStatus ? 'Added to featured' : 'Removed from featured')
    } catch (error) {
      console.error('Error toggling featured:', error)
      toast.error('Failed to update project')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const isOwnPortfolio = currentUser?.id === profile?.id

  return (
    <AppLayout username={currentUser?.username}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isOwnPortfolio ? 'My Portfolio' : `${profile.full_name}'s Portfolio`}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {projects.length} completed {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        {isOwnPortfolio && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-[20px] border" style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            No projects yet
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            {isOwnPortfolio 
              ? 'Start building your portfolio by adding your first project!'
              : 'This user hasn\'t added any projects yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-[20px] border overflow-hidden transition-all"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', padding: '0' }}
            >
              <div style={{ padding: '28px' }}>
                {/* Featured Badge */}
                {project.is_featured && (
                  <div className="inline-flex items-center gap-2 rounded-full text-xs font-semibold mb-3 px-3 py-1" style={{ backgroundColor: '#4b2e05', color: '#FDE68A' }}>
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}

                {/* Project Info */}
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {project.description}
                  </p>
                )}

                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {project.technologies.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs rounded-full bg-[rgba(255,255,255,0.04)] text-muted-foreground"
                        style={{ padding: '6px 12px', backdropFilter: 'blur(4px)' }}
                      >
                        {tech.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Completed Date */}
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Completed {new Date(project.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                {/* Actions */}
                <div className="flex gap-3 mt-4 items-center">
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full shadow-lg"
                      style={{ padding: '12px 22px' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Project
                    </a>
                  )}
                  
                  {isOwnPortfolio && (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(project.id, project.is_featured)}
                        className="rounded-full transition-all"
                        style={{ 
                          padding: '10px 16px',
                          backgroundColor: project.is_featured ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                          color: project.is_featured ? '#F59E0B' : 'var(--text-muted)'
                        }}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="rounded-full transition-all"
                        style={{ 
                          padding: '10px 16px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '20px' }}>
          <div className="rounded-[20px] border w-full max-w-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b" style={{ padding: '20px', borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Project</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="My Awesome Project"
                  className="w-full rounded-xl outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    color: 'var(--text-primary)',
                    padding: '12px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  className="w-full rounded-xl outline-none resize-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    color: 'var(--text-primary)',
                    padding: '12px',
                    minHeight: '100px'
                  }}
                  rows={4}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Project URL
                </label>
                <input
                  type="url"
                  value={newProject.projectUrl}
                  onChange={(e) => setNewProject({ ...newProject, projectUrl: e.target.value })}
                  placeholder="https://myproject.com"
                  className="w-full rounded-xl outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    color: 'var(--text-primary)',
                    padding: '12px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  placeholder="React, Node.js, TypeScript"
                  className="w-full rounded-xl outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    color: 'var(--text-primary)',
                    padding: '12px'
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 font-semibold rounded-full transition-colors"
                  style={{ 
                    padding: '12px 24px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newProject.title.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg disabled:opacity-50"
                  style={{ padding: '12px 24px' }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
