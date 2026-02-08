'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user && data.session) {
        // Store session token in cookie for middleware
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`
        toast.success('Welcome back!')
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to login')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[20px] border" style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <h2 className="text-xl font-bold" style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Login to BeBusy</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="relative">
          <Mail className="absolute h-5 w-5" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-[12px] focus:outline-none focus:border-[#10B981] transition-colors"
            style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            placeholder="you@example.com"
          />
        </div>

        <div className="relative">
          <Lock className="absolute h-5 w-5" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-[12px] focus:outline-none focus:border-[#10B981] transition-colors"
            style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '14px', paddingBottom: '14px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute transition-colors"
            style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#10B981] hover:bg-[#059669] disabled:cursor-not-allowed text-white font-semibold rounded-[12px] transition-colors flex items-center justify-center gap-2"
          style={{ paddingTop: '14px', paddingBottom: '14px', marginTop: '8px', opacity: loading ? 0.5 : 1, backgroundColor: loading ? 'var(--bg-tertiary)' : undefined }}
        >
          {loading ? 'Logging in...' : 'Login'}
          {!loading && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      <div className="text-center" style={{ marginTop: '24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#10B981] hover:underline font-medium">
            Sign up
          </Link>
        </p>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
          <Link href="/reset-password" className="text-[#10B981] hover:underline font-medium">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
