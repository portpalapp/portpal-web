import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, authError, enterDemoMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    const { error: authErr } =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, name);

    setLoading(false);

    if (authErr) {
      setError(authErr.message);
    } else if (mode === 'signup') {
      setSuccessMessage('Check your email to confirm your account');
    } else {
      // Login succeeded — go to dashboard
      navigate('/');
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Type your email address above, then click Forgot Password again.');
      return;
    }
    setLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/#/reset-password',
    });
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSuccessMessage(`We sent a password reset link to ${email.trim()}`);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <Anchor size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PORTPAL</h1>
          <p className="text-slate-400 text-sm mt-1">Shift tracking for longshoremen</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Auth error banner */}
          {authError && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 text-xs font-medium">Connection issue</p>
                <p className="text-orange-400/70 text-xs mt-0.5">
                  Having trouble connecting to the server. You can still explore the app.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Mail size={16} className="text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Tab toggle */}
          <div className="flex bg-slate-900/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Mike Thompson"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-blue-400 text-xs font-medium hover:text-blue-300"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Migrate link */}
        <button
          onClick={() => navigate('/migrate')}
          className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Existing PORTPAL user? Migrate your account
        </button>

        {/* Demo mode */}
        <button
          onClick={handleDemoMode}
          className="w-full py-3 text-slate-500 hover:text-slate-400 text-sm transition-colors"
        >
          Explore without signing in
        </button>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Made with solidarity in Vancouver, BC
        </p>
      </div>
    </div>
  );
}
