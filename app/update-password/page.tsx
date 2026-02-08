'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

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
              minLength={6}
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
              minLength={6}
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
      </div>
    </div>
  );
}
