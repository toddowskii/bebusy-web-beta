'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentProfile } from '@/lib/supabase/profiles'
import { getUserSettings } from '@/lib/supabase/settings'

type Theme = 'dark' | 'light' | 'auto'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  // Load theme from user settings
  useEffect(() => {
    loadUserTheme()
  }, [])

  // Update resolved theme when theme or system preference changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
    
    // Force background and text colors
    if (resolvedTheme === 'dark') {
      body.style.backgroundColor = '#000000'
      body.style.color = '#ECEDEE'
    } else {
      body.style.backgroundColor = '#FFFFFF'
      body.style.color = '#1F2937'
    }
  }, [resolvedTheme])

  const loadUserTheme = async () => {
    try {
      const profile = await getCurrentProfile()
      if (profile) {
        const { data: settings } = await getUserSettings(profile.id)
        if (settings?.theme) {
          setThemeState(settings.theme as Theme)
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
