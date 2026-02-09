'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // On mount, ensure Supabase processes the access token included in the reset link
    const ensureSession = async () => {
      try {
        const { data: current } = await supabase.auth.getSession();
        if (current?.session) {
          setSessionReady(true);
          return;
        }

        // If URL contains an access token (from the reset link), let Supabase parse it
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          // This will cause Supabase to parse the hash and set the session
          const { data, error } = await (supabase.auth as any).getSessionFromUrl?.() || {};
          if (error) {
            console.error('Error processing reset session from URL:', error);
          }
          // Clear the hash to avoid leaking tokens
          try {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          } catch (e) {
            // ignore
          }

          if (data?.session) {
            setSessionReady(true);
            return;
          }
        }

        // If no session could be established, do not allow password update
        setSessionReady(false);
      } catch (err) {
        console.error('Error checking supabase session:', err);
        setSessionReady(false);
      }
    };

    ensureSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionReady) {
      toast.error('No valid password reset session detected. Please open the link from your email or request a new reset link.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[20px] p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Update Password</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
          Enter your new password below.
        </p>

        {!sessionReady ? (
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">We couldn't establish a valid reset session. Please open the password reset link from your email. If you're having trouble, request a new reset link.</p>
            <a href="/reset-password" className="inline-block w-full bg-primary text-white rounded-full px-6 py-3 font-semibold hover:bg-primary-hover transition-colors">Request New Link</a>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderWidth: '2px', borderColor: 'transparent' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                placeholder="Enter new password"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderWidth: '2px', borderColor: 'transparent' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                placeholder="Confirm new password"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-full px-6 py-3 font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
