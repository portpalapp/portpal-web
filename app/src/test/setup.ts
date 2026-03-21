import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
const mockSupabaseAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
};

const mockSupabaseFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
});

const mockSupabaseRpc = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  },
}));

// ---------------------------------------------------------------------------
// Sample shift data for hooks
// ---------------------------------------------------------------------------
export const SAMPLE_SHIFTS = [
  {
    id: '1',
    date: '2026-03-18',
    job: 'TRACTOR TRAILER',
    location: 'CENTENNIAL',
    subjob: 'RAIL (TT)',
    shift: 'DAY' as const,
    regHours: 9,
    otHours: 0,
    regRate: 55.95,
    otRate: 83.93,
    totalPay: 503.55,
  },
  {
    id: '2',
    date: '2026-03-17',
    job: 'LABOUR',
    location: 'VANTERM',
    shift: 'NIGHT' as const,
    regHours: 8,
    otHours: 1,
    regRate: 69.67,
    otRate: 104.51,
    totalPay: 661.87,
  },
  {
    id: '3',
    date: '2026-03-16',
    job: 'HD MECHANIC',
    location: 'DELTAPORT',
    shift: 'DAY' as const,
    regHours: 8,
    otHours: 0,
    regRate: 57.80,
    otRate: 86.70,
    totalPay: 462.40,
  },
  {
    id: '4',
    date: '2026-01-05',
    job: 'WHEAT MACHINE',
    location: 'ALLIANCE GRAIN',
    shift: 'DAY' as const,
    regHours: 7.5,
    otHours: 0.5,
    regRate: 56.45,
    otRate: 84.68,
    totalPay: 465.72,
  },
  {
    id: '5',
    date: '2025-12-20',
    job: 'LIFT TRUCK',
    location: 'CENTENNIAL',
    shift: 'GRAVEYARD' as const,
    regHours: 7.5,
    otHours: 0,
    regRate: 86.55,
    otRate: 129.83,
    totalPay: 649.13,
  },
];

// ---------------------------------------------------------------------------
// Export mock handles for per-test customization
// ---------------------------------------------------------------------------
export { mockSupabaseAuth, mockSupabaseFrom, mockSupabaseRpc };
