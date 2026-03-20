import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  UserSearch,
  KeyRound,
  CheckCircle2,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Tab = 'email' | 'no-email' | 'code';

const UNION_LOCALS = ['500', '502', '505', '508', '514', '517'];

/** Generate a random temporary password (never shown to user). */
function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pw = '';
  for (let i = 0; i < 24; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export function Migrate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // -- Tab 1: "I have access to my email" --
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // -- Tab 2: "I can't access my email" --
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unionLocal, setUnionLocal] = useState('500');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<{
    bubble_id: string;
    masked_email: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailLoading, setNewEmailLoading] = useState(false);
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [newEmailSuccess, setNewEmailSuccess] = useState(false);

  // -- Tab 3: "I have a migration code" --
  const [migrationCode, setMigrationCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [codeEmail, setCodeEmail] = useState('');
  const [codePassword, setCodePassword] = useState('');

  // -----------------------------------------------------------------------
  // Tab 1 handler: migrate with existing email
  // -----------------------------------------------------------------------
  const handleEmailMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    setEmailLoading(true);
    try {
      // Check if this email exists in bubble_users
      const { data: bubbleUser, error: lookupError } = await supabase
        .from('bubble_users')
        .select('bubble_id, email')
        .ilike('email', email.trim())
        .is('supabase_user_id', null)
        .maybeSingle();

      if (lookupError) {
        setEmailError('Unable to look up your account. Please try again.');
        setEmailLoading(false);
        return;
      }

      if (!bubbleUser) {
        setEmailError(
          'No existing PORTPAL account was found with that email. Please check the spelling or use the "Can\'t access email" option.'
        );
        setEmailLoading(false);
        return;
      }

      // Create Supabase Auth account with a random temp password
      const tempPassword = generateTempPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: { data: { name: (bubbleUser as any).email } },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setEmailError(
            'A Supabase account with this email already exists. Try signing in, or use "Forgot Password" to reset it.'
          );
        } else {
          setEmailError(signUpError.message);
        }
        setEmailLoading(false);
        return;
      }

      // Link the Bubble user to the new Supabase Auth user
      if (signUpData.user) {
        await (supabase.rpc as any)('link_bubble_user', {
          p_email: email.trim(),
          p_supabase_uid: signUpData.user.id,
        });
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: window.location.origin + '/#/reset-password' }
      );

      if (resetError) {
        console.warn('[Migrate] Password reset email error:', resetError.message);
      }

      // Sign out the temp session so user must come back through the reset link
      await supabase.auth.signOut();

      setEmailSuccess(true);
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong. Please try again.');
    }
    setEmailLoading(false);
  };

  // -----------------------------------------------------------------------
  // Tab 2 handler: verify identity
  // -----------------------------------------------------------------------
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setVerifyError('Please enter your first and last name');
      return;
    }

    setVerifyLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)('verify_bubble_identity', {
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_union_local: unionLocal,
      });

      if (error) {
        setVerifyError('Unable to verify your identity. Please try again.');
        setVerifyLoading(false);
        return;
      }

      if (!data || (data as any).length === 0) {
        setVerifyError(
          'We could not find a PORTPAL account matching that name and union local. Please double-check your information.'
        );
        setVerifyLoading(false);
        return;
      }

      setMatchedUser(data[0]);
    } catch (err: any) {
      setVerifyError(err.message || 'Something went wrong. Please try again.');
    }
    setVerifyLoading(false);
  };

  // -----------------------------------------------------------------------
  // Tab 2 handler: submit new email
  // -----------------------------------------------------------------------
  const handleNewEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewEmailError(null);

    if (!newEmail.trim()) {
      setNewEmailError('Please enter your new email address');
      return;
    }
    if (!matchedUser) return;

    setNewEmailLoading(true);
    try {
      // Create Supabase Auth account with the new email
      const tempPassword = generateTempPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: tempPassword,
        options: {
          data: {
            name: `${matchedUser.first_name} ${matchedUser.last_name}`,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setNewEmailError(
            'This email is already registered. Please use a different email or try signing in.'
          );
        } else {
          setNewEmailError(signUpError.message);
        }
        setNewEmailLoading(false);
        return;
      }

      // Update the bubble user's email and link to Supabase Auth
      if (signUpData.user) {
        await (supabase.rpc as any)('update_bubble_user_email', {
          p_bubble_id: matchedUser.bubble_id,
          p_new_email: newEmail.trim(),
          p_supabase_uid: signUpData.user.id,
        });
      }

      // Send password reset so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        newEmail.trim(),
        { redirectTo: window.location.origin + '/#/reset-password' }
      );

      if (resetError) {
        console.warn('[Migrate] Password reset email error:', resetError.message);
      }

      // Sign out the temp session
      await supabase.auth.signOut();

      setNewEmailSuccess(true);
    } catch (err: any) {
      setNewEmailError(err.message || 'Something went wrong. Please try again.');
    }
    setNewEmailLoading(false);
  };

  // -----------------------------------------------------------------------
  // Tab 3 handler: migration code
  // -----------------------------------------------------------------------
  const handleCodeMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);

    const code = migrationCode.trim().toUpperCase();
    if (!code || code.length !== 8) {
      setCodeError('Please enter a valid 8-character migration code');
      return;
    }
    if (!codeEmail.trim()) {
      setCodeError('Please enter your email address');
      return;
    }

    setCodeLoading(true);
    try {
      // Validate password
      if (!codePassword || codePassword.length < 6) {
        setCodeError('Please enter a password (at least 6 characters).');
        setCodeLoading(false);
        return;
      }

      // Single server-side call: creates user, claims code, transfers shifts, creates profile
      const { data: migrateResult, error: migrateErr } = await (supabase.rpc as any)('migrate_with_code', {
        p_code: code.trim(),
        p_email: codeEmail.trim(),
        p_password: codePassword,
      });

      if (migrateErr) {
        setCodeError('Migration failed. Please try again or contact support.');
        console.warn('[Migrate] RPC error:', migrateErr.message);
        setCodeLoading(false);
        return;
      }

      if (migrateResult?.error) {
        setCodeError(migrateResult.error);
        setCodeLoading(false);
        return;
      }

      console.log('[Migrate] Success:', migrateResult.shifts_transferred, 'shifts transferred');

      // Sign in immediately with the credentials they just set
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: codeEmail.trim(),
        password: codePassword,
      });

      if (signInErr) {
        console.warn('[Migrate] Auto sign-in failed:', signInErr.message);
        setCodeSuccess(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setCodeError(err.message || 'Something went wrong. Please try again.');
    }
    setCodeLoading(false);
  };

  // -----------------------------------------------------------------------
  // Success screen
  // -----------------------------------------------------------------------
  if (emailSuccess || newEmailSuccess || codeSuccess) {
    const displayEmail = emailSuccess
      ? email.trim()
      : codeSuccess
        ? codeEmail.trim()
        : newEmail.trim();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-5">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>

            {codeSuccess ? (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Account migrated!</h2>
                <p className="text-slate-400 text-sm mb-6">Your shifts have been transferred. Sign in to get started.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-slate-400 text-sm mb-1">We sent a password setup link to</p>
                <p className="text-white font-semibold text-sm mb-6">{displayEmail}</p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-start gap-2.5">
                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">What happens next?</p>
                      <ol className="text-blue-300/80 text-xs space-y-1 list-decimal list-inside">
                        <li>Open the link in your email</li>
                        <li>Set a new password</li>
                        <li>Come back and sign in with your email and new password</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/login')}
            className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Migrate your account</h1>
            <p className="text-slate-400 text-xs mt-0.5">Transfer your existing PORTPAL data</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Tab selector */}
          <div className="flex bg-slate-900/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Mail size={14} />
              I have my email
            </button>
            <button
              onClick={() => setActiveTab('no-email')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'no-email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <UserSearch size={14} />
              Can't access email
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <KeyRound size={14} />
              Migration code
            </button>
          </div>

          {/* ============================================================= */}
          {/* Tab 1: Have email                                              */}
          {/* ============================================================= */}
          {activeTab === 'email' && (
            <div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Enter the email you used with PORTPAL. We'll send you a link to set up your new password.
                </p>
              </div>

              {emailError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{emailError}</p>
                </div>
              )}

              <form onSubmit={handleEmailMigration} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email used with PORTPAL
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {emailLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Migrate my account'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* Tab 2: No email access - identity verification                 */}
          {/* ============================================================= */}
          {activeTab === 'no-email' && !matchedUser && (
            <div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <Info size={18} className="text-orange-400 shrink-0 mt-0.5" />
                <p className="text-orange-300/80 text-xs leading-relaxed">
                  We'll verify your identity using your name and union local, then let you set up a new email for your account.
                </p>
              </div>

              {verifyError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{verifyError}</p>
                </div>
              )}

              <form onSubmit={handleVerifyIdentity} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Mike"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Thompson"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Union Local
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {UNION_LOCALS.map((local) => (
                      <button
                        key={local}
                        type="button"
                        onClick={() => setUnionLocal(local)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          unionLocal === local
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {local}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {verifyLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Find my account'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* Tab 2: Match found - enter new email                           */}
          {/* ============================================================= */}
          {activeTab === 'no-email' && matchedUser && (
            <div>
              {/* Match confirmation */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={20} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 text-sm font-medium">Account found</p>
                    <p className="text-green-300/80 text-xs mt-1">
                      {matchedUser.first_name} {matchedUser.last_name}
                    </p>
                    <p className="text-green-300/60 text-xs mt-0.5">
                      Original email: {matchedUser.masked_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <Mail size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Enter a new email address for your account. We'll send a password setup link to this email.
                </p>
              </div>

              {newEmailError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{newEmailError}</p>
                </div>
              )}

              <form onSubmit={handleNewEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    New Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="newemail@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newEmailLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {newEmailLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Set up new email'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMatchedUser(null);
                    setNewEmail('');
                    setNewEmailError(null);
                  }}
                  className="w-full py-2 text-slate-500 hover:text-slate-400 text-sm transition-colors"
                >
                  That's not me, try again
                </button>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* Tab 3: Migration code                                          */}
          {/* ============================================================= */}
          {activeTab === 'code' && (
            <div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <KeyRound size={18} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-purple-300/80 text-xs leading-relaxed">
                  Enter the 8-character migration code you received. This links your existing PORTPAL data to your new account.
                </p>
              </div>

              {codeError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{codeError}</p>
                </div>
              )}

              <form onSubmit={handleCodeMigration} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Migration Code
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="ABCD1234"
                      value={migrationCode}
                      onChange={e => setMigrationCode(e.target.value.toUpperCase().slice(0, 8))}
                      maxLength={8}
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {migrationCode.length}/8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={codeEmail}
                      onChange={e => setCodeEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Use the same email from your PORTPAL account, or a new one.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Choose a Password
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={codePassword}
                      onChange={e => setCodePassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={codeLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {codeLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Verify & Migrate'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Back to login */}
        <button
          onClick={() => navigate('/login')}
          className="w-full mt-4 py-3 text-slate-500 hover:text-slate-400 text-sm transition-colors text-center"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
