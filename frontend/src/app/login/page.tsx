'use client';

import { useState, FormEvent } from 'react';
import { m } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { staggerContainer, staggerItem, buttonTap, EASE } from '@/lib/animations';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4"
    >
      <m.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* Logo / Header */}
        <m.div variants={staggerItem} className="text-center mb-8">
          <m.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 mb-4"
          >
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </m.div>
          <h1 className="text-2xl font-bold text-white">Calling Agent</h1>
          <p className="text-slate-400 text-sm mt-1">Real Estate AI CRM</p>
        </m.div>

        {/* Login Card */}
        <m.div
          variants={staggerItem}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
            </div>

            {error && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400"
              >
                {error}
              </m.div>
            )}

            <m.button
              type="submit"
              disabled={loading}
              {...buttonTap}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </m.button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500">
              Use your Supabase Auth credentials
            </p>
          </div>
        </m.div>

        <m.p
          variants={staggerItem}
          className="text-center text-xs text-slate-600 mt-6"
        >
          © 2026 Calling Agent · Powered by Supabase Auth
        </m.p>
      </m.div>
    </m.div>
  );
}