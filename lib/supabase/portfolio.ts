import { supabase } from './client'
import { Database } from '@/types/database.types'

type PortfolioProject = Database['public']['Tables']['portfolio_projects']['Row']

// Create portfolio project
export async function createPortfolioProject(
  userId: string,
  title: string,
  description: string | null = null,
  imageUrl: string | null = null,
  projectUrl: string | null = null,
  technologies: string[] | null = null
) {
  try {
    const { data, error } = await (supabase as any)
      .from('portfolio_projects')
      .insert({
        user_id: userId,
        title,
        description,
        image_url: imageUrl,
        project_url: projectUrl,
        technologies,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating portfolio project:', error)
    return { data: null, error }
  }
}

// Update portfolio project
export async function updatePortfolioProject(
  projectId: string,
  updates: {
    title?: string
    description?: string | null
    image_url?: string | null
    project_url?: string | null
    technologies?: string[] | null
    is_featured?: boolean
  }
) {
  try {
    const { data, error } = await (supabase as any)
      .from('portfolio_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating portfolio project:', error)
    return { data: null, error }
  }
}

// Delete portfolio project
export async function deletePortfolioProject(projectId: string) {
  try {
    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting portfolio project:', error)
    return { error }
  }
}

// Get user's portfolio projects
export async function getUserPortfolio(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        console.warn('portfolio_projects table does not exist yet. Please run the migration.')
        return { data: [], error: null }
      }
      throw error
    }
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return { data: [], error: null }
  }
}

// Get featured portfolio projects
export async function getFeaturedProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_featured', true)
      .order('completed_at', { ascending: false })
      .limit(3)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return { data: null, error }
  }
}

// Toggle feature status
export async function toggleFeaturedProject(projectId: string, isFeatured: boolean) {
  try {
    const { data, error } = await (supabase as any)
      .from('portfolio_projects')
      .update({ is_featured: isFeatured })
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error toggling featured project:', error)
    return { data: null, error }
  }
}

// Get all public portfolios (for discovery)
export async function getPublicPortfolios(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching public portfolios:', error)
    return { data: null, error }
  }
}
