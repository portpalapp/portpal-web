import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Search,
  PlusCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  HelpCircle,
  ChevronRight,
  CloudUpload,
  Plus,
  Sun,
  Square,
  CheckSquare,
} from 'lucide-react';
import { useShifts } from '../hooks/useShifts';
import { getDemoPayStubs, comparePayStub } from '../lib/payStubParser';
import { formatDateShort } from '../lib/formatters';
import { supabase } from '../lib/supabase';
import type { ParsedPayStub, MatchStatus } from '../data/payStubTypes';

type ScreenView = 'list' | 'detail';

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; iconColor: string; Icon: typeof CheckCircle }> = {
  MATCH: { label: 'Verified', color: 'text-green-700', bg: 'bg-green-100', iconColor: '#16a34a', Icon: CheckCircle },
  RATE_DIFF: { label: 'Rate Diff', color: 'text-orange-700', bg: 'bg-orange-100', iconColor: '#ea580c', Icon: AlertCircle },
  HOURS_DIFF: { label: 'Hours Diff', color: 'text-amber-700', bg: 'bg-amber-100', iconColor: '#d97706', Icon: Clock },
  MISSING_IN_APP: { label: 'Not Logged', color: 'text-blue-700', bg: 'bg-blue-100', iconColor: '#2563eb', Icon: PlusCircle },
  MISSING_ON_STUB: { label: 'Not on Stub', color: 'text-red-700', bg: 'bg-red-100', iconColor: '#ef4444', Icon: HelpCircle },
};

const formatDate = formatDateShort;

export function PayStubs() {
  const navigate = useNavigate();
  const { shifts } = useShifts();
  const [view, setView] = useState<ScreenView>('list');
  const [stubs, setStubs] = useState<ParsedPayStub[]>([]);
  const [selectedStub, setSelectedStub] = useState<ParsedPayStub | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());
  const [importedJobs, setImportedJobs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comparison data for selected stub
  const comparisons = useMemo(() => {
    if (!selectedStub) return [];
    return comparePayStub(selectedStub, shifts);
  }, [selectedStub, shifts]);

  const matchCount = comparisons.filter((c) => c.status === 'MATCH').length;
  const discrepancyCount = comparisons.filter((c) => c.status === 'RATE_DIFF' || c.status === 'HOURS_DIFF').length;
  const missingCount = comparisons.filter((c) => c.status === 'MISSING_IN_APP').length;

  // Load demo data
  const handleDemo = () => {
    const demoStubs = getDemoPayStubs();
    setStubs(demoStubs);
  };

  // Handle PDF upload via HTML file input
  const handleUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileName = `pay-stubs/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pay-stubs')
        .upload(fileName, file, { contentType: 'application/pdf' });

      if (uploadError) {
        console.warn('[PayStubs] upload error:', uploadError.message);
      }

      // For now, show that we received the file but need backend parsing
      const tryDemo = confirm(
        `File: ${file.name}\n\nPDF parsing requires server-side processing. Would you like to try the demo to see the feature in action?`
      );
      if (tryDemo) handleDemo();
    } catch {
      alert('Could not upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Select a stub to view details
  const handleSelectStub = (stub: ParsedPayStub) => {
    setSelectedStub(stub);
    setExpandedDate(null);
    const missing = comparePayStub(stub, shifts)
      .filter((c) => c.status === 'MISSING_IN_APP')
      .map((c) => c.date);
    setSelectedForImport(new Set(missing));
    setView('detail');
  };

  // Toggle a shift for import
  const toggleImport = (date: string) => {
    const next = new Set(selectedForImport);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setSelectedForImport(next);
  };

  // Import selected shifts
  const handleImport = () => {
    const toImport = comparisons.filter(
      (c) => c.status === 'MISSING_IN_APP' && selectedForImport.has(c.date) && c.stubShift
    );

    if (toImport.length === 0) {
      alert('Select at least one shift to import.');
      return;
    }

    const confirmed = confirm(
      `Import ${toImport.length} shift${toImport.length > 1 ? 's' : ''} from this pay stub?\n\nYou can update the job names after importing.`
    );
    if (confirmed) {
      alert(
        `${toImport.length} shift${toImport.length > 1 ? 's' : ''} added to your log. Update the job names in your shift history.`
      );
    }
  };

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  // -- Empty State --

  if (view === 'list' && stubs.length === 0) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen flex flex-col">
        {fileInput}
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <span className="text-lg font-bold text-slate-800 flex-1">Pay Stubs</span>
        </div>

        <div className="flex-1 flex flex-col px-4 pb-8 justify-center max-w-lg mx-auto w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={40} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
              Upload Your Pay Stub
            </h2>
            <p className="text-sm text-slate-500 text-center leading-5 px-4">
              We'll read your BCMEA pay stub and automatically:
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { Icon: Search, color: '#ef4444', title: 'Find pay discrepancies', desc: 'Compare stub amounts against your logged shifts' },
              { Icon: PlusCircle, color: '#2563eb', title: 'Auto-add missing shifts', desc: "Import shifts you haven't logged yet" },
              { Icon: GraduationCap, color: '#9333ea', title: 'Learn correct rates', desc: 'Improve pay calculations based on real stubs' },
              { Icon: ShieldCheck, color: '#16a34a', title: 'Verify your entries', desc: 'Confirm your logged hours and pay are accurate' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: item.color + '15' }}>
                  <item.Icon size={20} color={item.color} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 rounded-xl py-4 flex items-center justify-center gap-2 mb-3 hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <CloudUpload size={20} className="text-white" />
            <span className="text-white font-semibold text-base">
              {uploading ? 'Uploading...' : 'Upload PDF Pay Stub'}
            </span>
          </button>

          <button onClick={handleDemo} className="py-3 text-center">
            <span className="text-blue-600 font-medium text-sm">Try with sample data</span>
          </button>
        </div>
      </div>
    );
  }

  // -- List View --

  if (view === 'list') {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        {fileInput}
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <span className="text-lg font-bold text-slate-800 flex-1">Pay Stubs</span>
          <button
            onClick={handleUpload}
            className="p-2 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
          >
            <Plus size={20} className="text-blue-600" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-8 max-w-2xl mx-auto">
          {/* Summary */}
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <p className="text-sm text-slate-300 mb-1">{stubs.length} Pay Stubs Loaded</p>
            <p className="text-2xl font-bold text-white">
              ${stubs.reduce((sum, s) => sum + s.netPay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total net pay across loaded stubs</p>
          </div>

          {/* Stub Cards */}
          <div className="space-y-3">
            {stubs.map((stub, i) => {
              const comp = comparePayStub(stub, shifts);
              const matches = comp.filter((c) => c.status === 'MATCH').length;
              const issues = comp.filter((c) => c.status === 'RATE_DIFF' || c.status === 'HOURS_DIFF').length;
              const missing = comp.filter((c) => c.status === 'MISSING_IN_APP').length;

              return (
                <button
                  key={i}
                  onClick={() => handleSelectStub(stub)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Pay Period {stub.payPeriod}/{stub.totalPayPeriods}
                      </p>
                      <p className="text-xs text-slate-500">
                        Week ending {formatDate(stub.payEndDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">
                        ${stub.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">net pay</p>
                    </div>
                  </div>

                  {/* Shift summary badges */}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-600">{stub.shifts.length} shifts</span>
                    {matches > 0 && (
                      <span className="inline-flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle size={12} className="text-green-600" />
                        <span className="text-xs text-green-700">{matches} verified</span>
                      </span>
                    )}
                    {issues > 0 && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded-full">
                        <AlertCircle size={12} className="text-orange-600" />
                        <span className="text-xs text-orange-700">{issues} discrepanc{issues > 1 ? 'ies' : 'y'}</span>
                      </span>
                    )}
                    {missing > 0 && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                        <PlusCircle size={12} className="text-blue-600" />
                        <span className="text-xs text-blue-700">{missing} to import</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end mt-2">
                    <span className="text-xs text-blue-600 font-medium">View Details</span>
                    <ChevronRight size={14} className="text-blue-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Detail View --

  return (
    <div className="flex-1 bg-slate-50 min-h-screen flex flex-col">
      {fileInput}
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-3">
        <button
          onClick={() => { setView('list'); setSelectedStub(null); }}
          className="hover:bg-slate-100 rounded-lg p-1 transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex-1">
          <p className="text-lg font-bold text-slate-800">
            Period {selectedStub?.payPeriod}/{selectedStub?.totalPayPeriods}
          </p>
          <p className="text-xs text-slate-500">
            Week ending {selectedStub ? formatDate(selectedStub.payEndDate) : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 max-w-2xl mx-auto w-full">
        {/* Pay Summary */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-4">
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400">Gross Pay</p>
              <p className="text-xl font-bold text-white">
                ${selectedStub?.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Net Pay</p>
              <p className="text-xl font-bold text-green-400">
                ${selectedStub?.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-xl p-2">
              <p className="text-xs text-slate-400">Tax</p>
              <p className="text-sm font-medium text-white">
                ${selectedStub?.deductions.federalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2">
              <p className="text-xs text-slate-400">Union</p>
              <p className="text-sm font-medium text-white">
                ${selectedStub?.deductions.unionDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2">
              <p className="text-xs text-slate-400">Benefits</p>
              <p className="text-sm font-medium text-white">
                ${((selectedStub?.deductions.welfare || 0) + (selectedStub?.deductions.groupLife || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* YTD Earnings */}
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
            <span className="text-xs text-slate-400">YTD Earnings</span>
            <span className="text-sm font-medium text-slate-300">
              ${selectedStub?.ytdEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="flex gap-3 mb-4">
          {matchCount > 0 && (
            <div className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-2xl font-bold text-green-600">{matchCount}</p>
              <p className="text-xs text-green-700">Verified</p>
            </div>
          )}
          {discrepancyCount > 0 && (
            <div className="flex-1 bg-orange-50 rounded-xl p-3 border border-orange-100">
              <p className="text-2xl font-bold text-orange-600">{discrepancyCount}</p>
              <p className="text-xs text-orange-700">Discrepancies</p>
            </div>
          )}
          {missingCount > 0 && (
            <div className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{missingCount}</p>
              <p className="text-xs text-blue-700">To Import</p>
            </div>
          )}
        </div>

        {/* Shift-by-Shift Breakdown */}
        <p className="text-sm font-semibold text-slate-700 mb-2">Shift Details</p>
        <div className="space-y-2 mb-4">
          {comparisons.map((comp, i) => {
            const config = STATUS_CONFIG[comp.status];
            const StatusIcon = config.Icon;
            const isExpanded = expandedDate === comp.date;
            const s = comp.stubShift;
            const isImportable = comp.status === 'MISSING_IN_APP';
            const isSelected = selectedForImport.has(comp.date);
            const assignedJob = importedJobs[comp.date];

            return (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedDate(isExpanded ? null : comp.date)}
                  className="w-full flex items-center p-3 gap-3 text-left hover:bg-slate-50 transition-colors"
                >
                  {/* Status icon */}
                  <div className={`p-1.5 rounded-lg ${config.bg}`}>
                    <StatusIcon size={18} color={config.iconColor} />
                  </div>

                  {/* Shift info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">
                        {formatDate(comp.date)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {s ? `${s.appLocation} \u2022 ${s.shiftType}` : `${comp.appShift?.location} \u2022 ${comp.appShift?.shift}`}
                      {s ? ` \u2022 ${s.regHours}h${s.otHours > 0 ? ` + ${s.otHours}h OT` : ''}` : ''}
                    </p>
                  </div>

                  {/* Pay amount */}
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      ${s ? s.totalAmount.toFixed(2) : comp.appShift?.totalPay.toFixed(2)}
                    </p>
                    {s && (
                      <p className="text-xs text-slate-500">@${s.regRate.toFixed(2)}/hr</p>
                    )}
                  </div>

                  {/* Import checkbox for missing shifts */}
                  {isImportable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleImport(comp.date); }}
                      className="ml-1"
                    >
                      {isSelected ? (
                        <CheckSquare size={22} className="text-blue-600" />
                      ) : (
                        <Square size={22} className="text-slate-400" />
                      )}
                    </button>
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-100">
                    {/* Stub data */}
                    {s && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-600 mb-1">Pay Stub Says:</p>
                        <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Regular</span>
                            <span className="text-xs text-slate-700">{s.regHours}h x ${s.regRate.toFixed(2)} = ${s.regAmount.toFixed(2)}</span>
                          </div>
                          {s.otHours > 0 && (
                            <div className="flex justify-between">
                              <span className="text-xs text-slate-600">Overtime</span>
                              <span className="text-xs text-slate-700">{s.otHours}h x ${s.otRate.toFixed(2)} = ${s.otAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {s.travelHours && s.travelHours > 0 && (
                            <div className="flex justify-between">
                              <span className="text-xs text-slate-600">Travel</span>
                              <span className="text-xs text-slate-700">{s.travelHours}h x ${s.travelRate?.toFixed(2)} = ${((s.travelRate || 0) * s.travelHours).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="text-xs font-medium text-slate-600">Terminal</span>
                            <span className="text-xs text-slate-700">{s.terminalRaw} ({s.companyCode})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-medium text-slate-600">Rate Class</span>
                            <span className="text-xs text-slate-700">{s.inferredDiffClass}</span>
                          </div>
                          {s.possibleJobs.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-slate-500">
                                Possible jobs: {s.possibleJobs.slice(0, 3).join(', ')}{s.possibleJobs.length > 3 ? ` +${s.possibleJobs.length - 3} more` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* App data */}
                    {comp.appShift && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-600 mb-1">Your Log Says:</p>
                        <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Job</span>
                            <span className="text-xs font-medium text-slate-700">{comp.appShift.job}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Location</span>
                            <span className="text-xs text-slate-700">{comp.appShift.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Hours</span>
                            <span className="text-xs text-slate-700">
                              {comp.appShift.regHours}h reg{comp.appShift.otHours > 0 ? ` + ${comp.appShift.otHours}h OT` : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Rate</span>
                            <span className="text-xs text-slate-700">${comp.appShift.regRate.toFixed(2)}/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Total</span>
                            <span className="text-xs font-medium text-slate-700">${comp.appShift.totalPay.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Discrepancy callout */}
                    {(comp.rateDifference || comp.hoursDifference || comp.payDifference) && (
                      <div className="mt-2 bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <p className="text-xs font-medium text-orange-800 mb-1">Discrepancy Found</p>
                        {comp.rateDifference && (
                          <p className="text-xs text-orange-700">
                            Rate difference: {comp.rateDifference > 0 ? '+' : ''}${comp.rateDifference.toFixed(2)}/hr
                            {comp.rateDifference > 0 ? ' (stub paid more)' : ' (stub paid less)'}
                          </p>
                        )}
                        {comp.hoursDifference && (
                          <p className="text-xs text-orange-700">
                            Hours difference: {comp.hoursDifference.toFixed(1)}h
                          </p>
                        )}
                        {comp.payDifference && (
                          <p className="text-xs text-orange-700">
                            Total pay difference: {comp.payDifference > 0 ? '+' : ''}${comp.payDifference.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Import: choose job */}
                    {isImportable && s && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Choose job for import:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {s.possibleJobs.map((job) => (
                            <button
                              key={job}
                              onClick={() => setImportedJobs({ ...importedJobs, [comp.date]: job })}
                              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                assignedJob === job
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {job}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vacation Info */}
        {selectedStub && (
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-4 flex items-center gap-3">
            <Sun size={20} className="text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Vacation: {selectedStub.vacationTaken} days taken, {selectedStub.vacationBalance} remaining
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Import Bar */}
      {missingCount > 0 && (
        <div className="px-4 py-3 bg-white border-t border-slate-200 max-w-2xl mx-auto w-full">
          <button
            onClick={handleImport}
            className="w-full bg-blue-600 rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={20} className="text-white" />
            <span className="text-white font-semibold">
              Import {selectedForImport.size} Shift{selectedForImport.size !== 1 ? 's' : ''}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
