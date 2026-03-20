import type { Shift } from '../../data/mockData';
import type { TemplateRecord } from '../../hooks/useTemplates';

export type ShiftType = 'DAY' | 'NIGHT' | 'GRAVEYARD';

export interface LastShiftData {
  job: string;
  location: string;
  subjob?: string;
  shift: ShiftType;
  date: string;
  regHours: number;
  otHours: number;
  regRate: number;
  otRate: number;
  totalPay: number;
}

export interface DifferentialOption {
  label: string;
  amount: number;
}

// Differential class definitions for the editable selector
export const DIFFERENTIAL_CLASSES = [
  { label: 'BASE', amount: 0.0 },
  { label: 'CLASS_4', amount: 0.5 },
  { label: 'CLASS_3', amount: 0.65 },
  { label: 'CLASS_2', amount: 1.0 },
  { label: 'CLASS_1', amount: 2.5 },
] as const;

// Step labels for the progress bar
export const STEP_LABELS = ['Job', 'Details', 'Review & Save'];

// ─── Reducer ───

export interface ShiftFormState {
  step: number;
  step1Mode: 'choose' | 'templates' | 'jobs';
  job: string;
  location: string;
  subjob: string;
  shift: ShiftType;
  date: string;
  regHours: number;
  otHours: number;
  notes: string;
  foreman: string;
  vesselName: string;
  attachments: { uri: string; name: string }[];
  customSubjob: string;
  showCustomSubjob: boolean;
  customLocation: string;
  showCustomLocation: boolean;
  editingRate: boolean;
  manualRegRate: number | null;
  manualRateText: string;
  overrideDiff: DifferentialOption | null;
  showDiffPicker: boolean;
  showTemplates: boolean;
  newTemplateName: string;
  showSaveTemplate: boolean;
  showAllTerminals: boolean;
  saving: boolean;
}

export type ShiftFormAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_STEP1_MODE'; mode: 'choose' | 'templates' | 'jobs' }
  | { type: 'SET_JOB'; job: string }
  | { type: 'SET_LOCATION'; location: string }
  | { type: 'SET_SUBJOB'; subjob: string }
  | { type: 'SET_SHIFT'; shift: ShiftType }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_REG_HOURS'; hours: number }
  | { type: 'SET_OT_HOURS'; hours: number }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_FOREMAN'; foreman: string }
  | { type: 'SET_VESSEL_NAME'; vesselName: string }
  | { type: 'SET_ATTACHMENTS'; attachments: { uri: string; name: string }[] }
  | { type: 'SET_CUSTOM_SUBJOB'; value: string }
  | { type: 'SET_SHOW_CUSTOM_SUBJOB'; show: boolean }
  | { type: 'SET_CUSTOM_LOCATION'; value: string }
  | { type: 'SET_SHOW_CUSTOM_LOCATION'; show: boolean }
  | { type: 'SET_EDITING_RATE'; editing: boolean }
  | { type: 'SET_MANUAL_REG_RATE'; rate: number | null }
  | { type: 'SET_MANUAL_RATE_TEXT'; text: string }
  | { type: 'SET_OVERRIDE_DIFF'; diff: DifferentialOption | null }
  | { type: 'SET_SHOW_DIFF_PICKER'; show: boolean }
  | { type: 'SET_SHOW_TEMPLATES'; show: boolean }
  | { type: 'SET_NEW_TEMPLATE_NAME'; name: string }
  | { type: 'SET_SHOW_SAVE_TEMPLATE'; show: boolean }
  | { type: 'SET_SHOW_ALL_TERMINALS'; show: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SELECT_JOB'; job: string }
  | { type: 'APPLY_TEMPLATE'; template: { job: string; location: string; subjob?: string | null; shift: string } }
  | { type: 'APPLY_CALLBACK'; lastShift: LastShiftData; mode: 'direct' | 'edit' }
  | { type: 'APPLY_DIFF_SELECTION'; diff: DifferentialOption }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_ON_BLUR' };

export function getInitialState(todayStr: string): ShiftFormState {
  return {
    step: 1,
    step1Mode: 'choose',
    job: '',
    location: '',
    subjob: '',
    shift: 'DAY',
    date: todayStr,
    regHours: 8,
    otHours: 0,
    notes: '',
    foreman: '',
    vesselName: '',
    attachments: [],
    customSubjob: '',
    showCustomSubjob: false,
    customLocation: '',
    showCustomLocation: false,
    editingRate: false,
    manualRegRate: null,
    manualRateText: '',
    overrideDiff: null,
    showDiffPicker: false,
    showTemplates: false,
    newTemplateName: '',
    showSaveTemplate: false,
    showAllTerminals: false,
    saving: false,
  };
}

export function shiftFormReducer(state: ShiftFormState, action: ShiftFormAction): ShiftFormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_STEP1_MODE':
      return { ...state, step1Mode: action.mode };
    case 'SET_JOB':
      return { ...state, job: action.job };
    case 'SET_LOCATION':
      return { ...state, location: action.location };
    case 'SET_SUBJOB':
      return { ...state, subjob: action.subjob };
    case 'SET_SHIFT':
      return { ...state, shift: action.shift };
    case 'SET_DATE':
      return { ...state, date: action.date };
    case 'SET_REG_HOURS':
      return { ...state, regHours: action.hours };
    case 'SET_OT_HOURS':
      return { ...state, otHours: action.hours };
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_FOREMAN':
      return { ...state, foreman: action.foreman };
    case 'SET_VESSEL_NAME':
      return { ...state, vesselName: action.vesselName };
    case 'SET_ATTACHMENTS':
      return { ...state, attachments: action.attachments };
    case 'SET_CUSTOM_SUBJOB':
      return { ...state, customSubjob: action.value };
    case 'SET_SHOW_CUSTOM_SUBJOB':
      return { ...state, showCustomSubjob: action.show };
    case 'SET_CUSTOM_LOCATION':
      return { ...state, customLocation: action.value };
    case 'SET_SHOW_CUSTOM_LOCATION':
      return { ...state, showCustomLocation: action.show };
    case 'SET_EDITING_RATE':
      return { ...state, editingRate: action.editing };
    case 'SET_MANUAL_REG_RATE':
      return { ...state, manualRegRate: action.rate };
    case 'SET_MANUAL_RATE_TEXT':
      return { ...state, manualRateText: action.text };
    case 'SET_OVERRIDE_DIFF':
      return { ...state, overrideDiff: action.diff };
    case 'SET_SHOW_DIFF_PICKER':
      return { ...state, showDiffPicker: action.show };
    case 'SET_SHOW_TEMPLATES':
      return { ...state, showTemplates: action.show };
    case 'SET_NEW_TEMPLATE_NAME':
      return { ...state, newTemplateName: action.name };
    case 'SET_SHOW_SAVE_TEMPLATE':
      return { ...state, showSaveTemplate: action.show };
    case 'SET_SHOW_ALL_TERMINALS':
      return { ...state, showAllTerminals: action.show };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };

    case 'SELECT_JOB':
      return {
        ...state,
        job: action.job,
        subjob: '',
        overrideDiff: null,
        step: 2,
      };

    case 'APPLY_TEMPLATE':
      return {
        ...state,
        job: action.template.job,
        location: action.template.location,
        subjob: action.template.subjob || '',
        shift: action.template.shift as ShiftType,
        showTemplates: false,
        step1Mode: 'choose',
        step: 3,
      };

    case 'APPLY_CALLBACK':
      return {
        ...state,
        job: action.lastShift.job,
        location: action.lastShift.location,
        subjob: action.lastShift.subjob || '',
        shift: action.lastShift.shift,
        date: state.date, // keep current date
        step1Mode: action.mode === 'edit' ? 'jobs' : 'choose',
        step: action.mode === 'direct' ? 3 : action.mode === 'edit' ? state.step : state.step,
      };

    case 'APPLY_DIFF_SELECTION':
      return {
        ...state,
        overrideDiff: { label: action.diff.label, amount: action.diff.amount },
        manualRegRate: null,
        manualRateText: '',
        editingRate: false,
        showDiffPicker: false,
      };

    case 'RESET_FORM':
      return {
        ...state,
        step: 1,
        step1Mode: 'choose',
        job: '',
        location: '',
        subjob: '',
        manualRegRate: null,
        editingRate: false,
        manualRateText: '',
        notes: '',
        foreman: '',
        vesselName: '',
        attachments: [],
        overrideDiff: null,
        showDiffPicker: false,
        showSaveTemplate: false,
        newTemplateName: '',
      };

    case 'RESET_ON_BLUR':
      return {
        ...state,
        step: 1,
        step1Mode: 'choose',
        job: '',
        location: '',
        subjob: '',
        overrideDiff: null,
        manualRegRate: null,
        editingRate: false,
        manualRateText: '',
        notes: '',
        foreman: '',
        vesselName: '',
        attachments: [],
      };

    default:
      return state;
  }
}
