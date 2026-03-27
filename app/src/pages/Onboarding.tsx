import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  MapPin,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

const TOTAL_STEPS = 3;

const UNION_LOCALS = [
  { id: '500', name: 'Local 500', location: 'Vancouver' },
  { id: '502', name: 'Local 502', location: 'New Westminster' },
  { id: '505', name: 'Local 505', location: 'Prince Rupert' },
  { id: '508', name: 'Local 508', location: 'Chemainus / Nanaimo' },
  { id: '514', name: 'Local 514', location: 'Burnaby (Foremen)' },
  { id: '517', name: 'Local 517', location: 'Vancouver (Warehouse)' },
];

const BOARDS = [
  { id: 'A', name: 'A Board', description: 'Full-time registered longshoreman' },
  { id: 'B', name: 'B Board', description: 'Full-time registered longshoreman (secondary)' },
  { id: 'C', name: 'C Board', description: 'Casual / spare board worker' },
  { id: 'T', name: 'T Board', description: 'Probationary / training status' },
  { id: '00', name: '00 Board', description: 'Limited Tenure / temporary' },
  { id: 'R', name: 'R Board', description: 'Retired with recall rights' },
];

const PRIMARY_TERMINALS = [
  'CENTENNIAL',
  'VANTERM',
  'DELTAPORT',
  'FRASER SURREY',
  'LYNNTERM',
  'NEPTUNE',
];

const OTHER_TERMINALS = [
  'ALLIANCE GRAIN',
  'ANNACIS AUTO',
  'CARGILL',
  'CASCADIA',
  'CHEMTRADE',
  'FIBRECO',
  'G3 TERMINAL',
  'PACIFIC COAST',
  'PACIFIC ELEVATORS',
  'RICHARDSON',
  'SQUAMISH',
  'VITERRA PAC',
  'WEST COAST REDUCTION',
  'WESTSHORE',
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedLocal, setSelectedLocal] = useState('500');
  const [selectedBoard, setSelectedBoard] = useState('A');
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const [showOtherTerminals, setShowOtherTerminals] = useState(false);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleTerminal = (terminal: string) => {
    setSelectedTerminals(prev =>
      prev.includes(terminal)
        ? prev.filter(t => t !== terminal)
        : [...prev, terminal]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (user) {
        // Save profile to Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            union_local: selectedLocal,
            board: selectedBoard,
            home_terminal: selectedTerminals.length > 0 ? selectedTerminals[0] : null,
          });

        if (error) {
          console.warn('[Onboarding] Profile update error:', error);
        }
      }

      // Save favorite terminals and onboarding status to localStorage
      localStorage.setItem('portpal_favorite_terminals', JSON.stringify(selectedTerminals));
      localStorage.setItem('portpal_onboarding_completed', 'true');

      setSaving(false);
      navigate('/');
    } catch (err) {
      console.warn('[Onboarding] Error saving:', err);
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Progress bar
  // -----------------------------------------------------------------------
  const renderProgressBar = () => (
    <div className="flex items-center gap-2 px-6 pt-6 pb-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= step ? 'bg-blue-500' : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  );

  // -----------------------------------------------------------------------
  // Step 1: Union Local
  // -----------------------------------------------------------------------
  const renderStepLocal = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <h2 className="text-2xl font-bold text-white mb-2 mt-4">
        Which local are you in?
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Select your ILWU local union.
      </p>

      <div className="space-y-3">
        {UNION_LOCALS.map(local => {
          const isSelected = selectedLocal === local.id;
          return (
            <button
              key={local.id}
              onClick={() => setSelectedLocal(local.id)}
              className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 ${
                  isSelected ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {local.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold ${
                    isSelected ? 'text-blue-300' : 'text-white'
                  }`}
                >
                  {local.name}
                </p>
                <p
                  className={`text-sm ${
                    isSelected ? 'text-blue-400/70' : 'text-slate-500'
                  }`}
                >
                  {local.location}
                </p>
              </div>
              {isSelected && (
                <CheckCircle2 size={22} className="text-blue-400 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Step 2: Board
  // -----------------------------------------------------------------------
  const renderStepBoard = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <h2 className="text-2xl font-bold text-white mb-2 mt-4">
        What board are you on?
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Select your dispatch board.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {BOARDS.map(board => {
          const isSelected = selectedBoard === board.id;
          return (
            <button
              key={board.id}
              onClick={() => setSelectedBoard(board.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-2xl font-bold ${
                    isSelected ? 'text-blue-400' : 'text-slate-400'
                  }`}
                >
                  {board.id}
                </span>
                {isSelected && (
                  <CheckCircle2 size={18} className="text-blue-400" />
                )}
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isSelected ? 'text-blue-300/70' : 'text-slate-500'
                }`}
              >
                {board.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Step 3: Favorite Terminals
  // -----------------------------------------------------------------------
  const renderStepTerminals = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <h2 className="text-2xl font-bold text-white mb-2 mt-4">
        Which terminals do you work at?
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Select all that apply. These will appear first when logging shifts.
      </p>

      {/* Selected count */}
      {selectedTerminals.length > 0 && (
        <div className="flex items-center justify-between mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
          <span className="text-blue-400 text-sm font-medium">
            {selectedTerminals.length} terminal{selectedTerminals.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setSelectedTerminals([])}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Primary terminals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PRIMARY_TERMINALS.map(terminal => {
          const isSelected = selectedTerminals.includes(terminal);
          return (
            <button
              key={terminal}
              onClick={() => toggleTerminal(terminal)}
              className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <MapPin
                  size={18}
                  className={isSelected ? 'text-blue-400' : 'text-slate-500'}
                />
                {isSelected && (
                  <CheckCircle2 size={18} className="text-blue-400" />
                )}
              </div>
              <p
                className={`font-semibold text-sm ${
                  isSelected ? 'text-blue-300' : 'text-slate-300'
                }`}
              >
                {terminal}
              </p>
            </button>
          );
        })}
      </div>

      {/* Other terminals toggle */}
      <button
        onClick={() => setShowOtherTerminals(!showOtherTerminals)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
          OTHER_TERMINALS.some(t => selectedTerminals.includes(t))
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-slate-500" />
          <span className="text-slate-300 font-medium text-sm">Other locations...</span>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-slate-500 transition-transform ${showOtherTerminals ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showOtherTerminals && (
        <div className="mt-2 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          {OTHER_TERMINALS.map((terminal, idx) => {
            const isSelected = selectedTerminals.includes(terminal);
            return (
              <button
                key={terminal}
                onClick={() => toggleTerminal(terminal)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  idx < OTHER_TERMINALS.length - 1 ? 'border-b border-slate-700/50' : ''
                } ${isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-700/30'}`}
              >
                <span
                  className={`text-sm ${
                    isSelected ? 'text-blue-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {terminal}
                </span>
                {isSelected && (
                  <Check size={16} className="text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render current step
  // -----------------------------------------------------------------------
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderStepLocal();
      case 1:
        return renderStepBoard();
      case 2:
        return renderStepTerminals();
      default:
        return null;
    }
  };

  const localInfo = UNION_LOCALS.find(l => l.id === selectedLocal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Anchor size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Set up your profile</h1>
            <p className="text-slate-400 text-xs">Step {step + 1} of {TOTAL_STEPS}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col" style={{ minHeight: '500px' }}>
          {/* Progress bar */}
          {renderProgressBar()}

          {/* Back button */}
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 px-6 pt-2 pb-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </button>
          )}

          {/* Step content */}
          {renderStep()}

          {/* Bottom navigation */}
          <div className="px-6 pb-6 pt-2">
            {step < TOTAL_STEPS - 1 ? (
              <div className="flex gap-3">
                {step === 2 && (
                  <button
                    onClick={goNext}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-700 text-slate-400 font-semibold hover:border-slate-600 hover:text-slate-300 transition-all"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={goNext}
                  className={`py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all ${
                    step === 2 ? 'flex-1' : 'w-full'
                  }`}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Start Tracking
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary preview */}
        {step === TOTAL_STEPS - 1 && (
          <div className="mt-4 bg-slate-800/40 backdrop-blur border border-slate-700/30 rounded-xl p-4">
            <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Profile Summary</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Union Local</span>
                <span className="text-white text-sm font-medium">
                  Local {selectedLocal}{localInfo ? ` - ${localInfo.location}` : ''}
                </span>
              </div>
              <div className="h-px bg-slate-700/50" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Board</span>
                <span className="text-white text-sm font-medium">
                  {selectedBoard} Board
                </span>
              </div>
              {selectedTerminals.length > 0 && (
                <>
                  <div className="h-px bg-slate-700/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Terminals</span>
                    <span className="text-white text-sm font-medium">
                      {selectedTerminals.length} selected
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
