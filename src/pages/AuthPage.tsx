import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { EN_COPY } from '../i18n/en.ts';

export function AuthPage() {
  const { navigate, loginWithEmail, registerWithEmail, loginWithDemoAccount, authLoading } =
    useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    try {
      await loginWithDemoAccount();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-xl border border-[#DCD4BE] bg-[#F2EDE2] p-4 text-xs leading-relaxed text-[#3A413C]">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
          <p>{EN_COPY.demoBanner}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#DCD4BE] bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-[#1B4332]">
          {mode === 'signin' ? 'Sign in as tree owner' : 'Create a demo owner account'}
        </h1>
        <p className="mt-1.5 text-sm text-[#5E6660]">
          Tree owners manage private trees, invite links, and family submissions.
        </p>

        <div className="mt-5">
          <button
            type="button"
            disabled={authLoading}
            onClick={handleDemoSignIn}
            className="w-full min-h-[44px] rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] disabled:opacity-60 cursor-pointer transition-colors"
          >
            {authLoading ? 'Signing in…' : 'Continue with Demo Owner Account'}
          </button>
          <p className="mt-1.5 text-center text-xs text-[#5E6660]">
            Includes the fictional Kulkarni &amp; Rao sample tree and a pending family submission
            ready to review.
          </p>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-[#5E6660]">
          <div className="h-px flex-1 bg-[#E5DEC9]" />
          <span>or use email in demo session</span>
          <div className="h-px flex-1 bg-[#E5DEC9]" />
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`rounded-md py-1.5 text-xs font-medium cursor-pointer ${
              mode === 'signin' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5E6660]'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`rounded-md py-1.5 text-xs font-medium cursor-pointer ${
              mode === 'signup' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5E6660]'
            }`}
          >
            Create account
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-[#1F2421]">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ananya Sharma"
                className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1B4332] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-[#1F2421]">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-[#1F2421]">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full min-h-[42px] rounded-lg border border-[#1B4332] bg-white px-4 py-2 text-sm font-medium text-[#1B4332] hover:bg-[#EAF0EC] disabled:opacity-60 cursor-pointer transition-colors"
          >
            {mode === 'signin' ? 'Sign in with email' : 'Create demo account'}
          </button>
        </form>
      </div>
    </div>
  );
}
