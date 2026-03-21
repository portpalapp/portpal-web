import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Check,
  XCircle,
  PlusCircle,
  Plus,
  Moon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useProfile } from '../hooks/useProfile';
import { LOCATIONS } from '../data/mockData';

const UNION_LOCALS = ['500', '502', '505', '508', '514', '517'] as const;

export function Profile() {
  const navigate = useNavigate();
  const { user, demoMode, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  // Dark mode via localStorage
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('portpal_dark_mode') === 'true'; } catch { return false; }
  });
  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem('portpal_dark_mode', String(next)); } catch { /* ignore */ }
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Favorite terminals via localStorage
  const [favoriteTerminals, setFavoriteTerminals] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('portpal_favorite_terminals');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const addFavorite = (terminal: string) => {
    const next = [...favoriteTerminals, terminal];
    setFavoriteTerminals(next);
    try { localStorage.setItem('portpal_favorite_terminals', JSON.stringify(next)); } catch { /* ignore */ }
  };
  const removeFavorite = (terminal: string) => {
    const next = favoriteTerminals.filter(t => t !== terminal);
    setFavoriteTerminals(next);
    try { localStorage.setItem('portpal_favorite_terminals', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unionLocal, setUnionLocal] = useState('500');
  const [saving, setSaving] = useState(false);
  const [showLocalPicker, setShowLocalPicker] = useState(false);
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);

  // Populate fields from profile when loaded
  useEffect(() => {
    if (profile && profile.name) {
      const parts = profile.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (profile && profile.board) {
      setUnionLocal(profile.board);
    }
  }, [profile]);

  const email = user?.email || (demoMode ? 'demo@portpal.app' : '');

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    if (first && last) return `${first}${last}`;
    if (first) return first;
    return 'U';
  };

  const handleSave = async () => {
    if (demoMode) {
      alert('Demo Mode: Sign in to save profile changes.');
      return;
    }

    if (!firstName.trim()) {
      alert('First name is required.');
      return;
    }

    setSaving(true);
    const fullName = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    const { error } = await updateProfile({
      name: fullName,
      board: unionLocal,
    });
    setSaving(false);

    if (error) {
      alert('Failed to save profile. Please try again.');
    } else {
      alert('Your profile has been updated.');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/login');
    }
  };

  if (profileLoading) {
    return (
      <div className={`flex-1 flex items-center justify-center min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header with back button */}
      <div className={`flex items-center px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button onClick={() => navigate(-1)} className="p-1 mr-3 hover:opacity-70">
          <ArrowLeft size={24} className={isDark ? 'text-slate-200' : 'text-slate-800'} />
        </button>
        <span className={`text-lg font-bold flex-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Profile
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-12">
        {/* Avatar / Initials Circle */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-700' : 'bg-blue-600'}`}>
            <span className="text-white text-3xl font-bold">
              {getInitials()}
            </span>
          </div>
          <span className={`mt-3 text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {firstName || 'User'} {lastName}
          </span>
          {!demoMode && (
            <span className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Local {unionLocal}
            </span>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          {/* First Name */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              First Name
            </label>
            <input
              type="text"
              className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-blue-400 ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Last Name
            </label>
            <input
              type="text"
              className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-blue-400 ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Email
            </label>
            <input
              type="email"
              className={`w-full border rounded-xl px-4 py-3 ${
                isDark
                  ? 'bg-slate-700 border-slate-600 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              value={email}
              readOnly
            />
          </div>

          {/* Union Local Dropdown */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Union Local
            </label>
            <button
              onClick={() => setShowLocalPicker(!showLocalPicker)}
              className={`w-full border rounded-xl px-4 py-3 flex items-center justify-between ${
                isDark
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className={isDark ? 'text-slate-100' : 'text-slate-800'}>
                Local {unionLocal}
              </span>
              {showLocalPicker ? (
                <ChevronUp size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              ) : (
                <ChevronDown size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              )}
            </button>

            {showLocalPicker && (
              <div className={`mt-1 border rounded-xl overflow-hidden ${
                isDark
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}>
                {UNION_LOCALS.map((local) => (
                  <button
                    key={local}
                    onClick={() => {
                      setUnionLocal(local);
                      setShowLocalPicker(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between border-b text-left ${
                      isDark ? 'border-slate-700' : 'border-slate-100'
                    } ${
                      local === unionLocal
                        ? isDark
                          ? 'bg-blue-900/30'
                          : 'bg-blue-50'
                        : isDark
                          ? 'hover:bg-slate-700'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={
                      local === unionLocal
                        ? 'text-blue-600 font-semibold'
                        : isDark
                          ? 'text-slate-200'
                          : 'text-slate-700'
                    }>
                      Local {local}
                    </span>
                    {local === unionLocal && (
                      <Check size={18} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Terminals */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Your Terminals
              </span>
              <button
                onClick={() => setShowTerminalPicker(!showTerminalPicker)}
                className="flex items-center gap-1 hover:opacity-70"
              >
                {showTerminalPicker ? (
                  <XCircle size={16} className="text-blue-600" />
                ) : (
                  <PlusCircle size={16} className="text-blue-600" />
                )}
                <span className="text-xs font-medium text-blue-600">
                  {showTerminalPicker ? 'Done' : 'Edit'}
                </span>
              </button>
            </div>

            {/* Current favorites as removable chips */}
            {favoriteTerminals.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {favoriteTerminals.map((terminal) => (
                  <div
                    key={terminal}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                      isDark
                        ? 'bg-blue-900/30 border border-blue-700'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {terminal}
                    </span>
                    <button onClick={() => removeFavorite(terminal)} className="hover:opacity-70">
                      <XCircle size={16} className={isDark ? 'text-blue-300' : 'text-blue-500'} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No favorite terminals set. Tap Edit to add some.
              </p>
            )}

            {/* Terminal picker */}
            {showTerminalPicker && (
              <div className={`border rounded-xl overflow-hidden mb-1 ${
                isDark
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}>
                {LOCATIONS.filter((loc) => !favoriteTerminals.includes(loc)).map(
                  (loc, idx, arr) => (
                    <button
                      key={loc}
                      onClick={() => addFavorite(loc)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left ${
                        idx < arr.length - 1
                          ? isDark
                            ? 'border-b border-slate-700'
                            : 'border-b border-slate-100'
                          : ''
                      } ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                    >
                      <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                        {loc}
                      </span>
                      <Plus size={18} className="text-blue-600" />
                    </button>
                  )
                )}
                {LOCATIONS.filter((loc) => !favoriteTerminals.includes(loc)).length === 0 && (
                  <div className="px-4 py-3">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      All terminals have been added.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <div className={`border rounded-xl px-4 py-3 flex items-center justify-between ${
            isDark
              ? 'bg-slate-800 border-slate-600'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <Moon size={20} className={isDark ? 'text-violet-400' : 'text-slate-500'} />
              <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Dark Mode
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDark}
                onChange={toggleDark}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 rounded-xl py-3.5 text-center mt-8 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
          ) : (
            <span className="text-white font-semibold text-base">
              Save Changes
            </span>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={`w-full rounded-xl py-3.5 text-center mt-4 border hover:opacity-80 transition-opacity ${
            isDark ? 'border-red-800' : 'border-red-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut size={20} className="text-red-500" />
            <span className="text-red-500 font-semibold text-base">
              Sign Out
            </span>
          </div>
        </button>

        {/* App Version */}
        <p className={`text-center text-xs mt-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          PORTPAL v1.0.0
        </p>
      </div>
    </div>
  );
}
