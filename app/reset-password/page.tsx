'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C1E] rounded-[20px] p-8">
          <div className="text-center">
            <div className="mb-4 text-[#10B981] text-5xl">✓</div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <strong className="text-white">{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="w-full bg-[#10B981] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#0ea472] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1C1C1E] rounded-[20px] p-8">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#2C2C2E] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10B981] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#0ea472] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-[#10B981] hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
