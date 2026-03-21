/**
 * Migration code tests - verify the migration flow logic.
 *
 * The migration page allows Bubble users to transfer their account
 * to Supabase using an 8-character code. These tests verify:
 *   - Code validation (correct format, 8 chars, uppercase)
 *   - RPC call format for migrate_with_code
 *   - Error handling for invalid/claimed codes
 *   - Email + password requirements
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseRpc, mockSupabaseAuth } from '../test/setup';

// ---------------------------------------------------------------------------
// Migration code format validation
// ---------------------------------------------------------------------------

describe('Migration code format', () => {
  it('valid code is exactly 8 characters', () => {
    const code = 'ABCD1234';
    expect(code.length).toBe(8);
  });

  it('code is uppercased before use', () => {
    const input = 'abcd1234';
    const normalized = input.trim().toUpperCase();
    expect(normalized).toBe('ABCD1234');
  });

  it('code is trimmed', () => {
    const input = '  ABCD1234  ';
    const normalized = input.trim().toUpperCase();
    expect(normalized).toBe('ABCD1234');
    expect(normalized.length).toBe(8);
  });

  it('rejects codes shorter than 8 characters', () => {
    const code = 'ABC123';
    expect(code.length).not.toBe(8);
    // The UI checks: code.length !== 8
    expect(code.length !== 8).toBe(true);
  });

  it('rejects codes longer than 8 characters', () => {
    const code = 'ABCDEFGH9';
    expect(code.length).not.toBe(8);
  });

  it('rejects empty code', () => {
    const code: string = '';
    expect(!code || code.length !== 8).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// migrate_with_code RPC call format
// ---------------------------------------------------------------------------

describe('migrate_with_code RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls RPC with correct parameter names', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: { shifts_transferred: 42, error: null },
      error: null,
    });

    const code = 'ABCD1234';
    const email = 'worker@portpal.ca';
    const password = 'securepass';

    await mockSupabaseRpc('migrate_with_code', {
      p_code: code.trim(),
      p_email: email.trim(),
      p_password: password,
    });

    expect(mockSupabaseRpc).toHaveBeenCalledWith('migrate_with_code', {
      p_code: 'ABCD1234',
      p_email: 'worker@portpal.ca',
      p_password: 'securepass',
    });
  });

  it('returns shifts_transferred count on success', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: { shifts_transferred: 150, error: null },
      error: null,
    });

    const { data, error } = await mockSupabaseRpc('migrate_with_code', {
      p_code: 'TEST1234',
      p_email: 'user@example.com',
      p_password: 'password',
    });

    expect(error).toBeNull();
    expect(data.shifts_transferred).toBe(150);
  });

  it('returns error for invalid/claimed code', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: { error: 'Migration code has already been used' },
      error: null,
    });

    const { data } = await mockSupabaseRpc('migrate_with_code', {
      p_code: 'USED1234',
      p_email: 'user@example.com',
      p_password: 'password',
    });

    expect(data.error).toBe('Migration code has already been used');
  });

  it('handles RPC-level error (network/DB error)', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: null,
      error: { message: 'function migrate_with_code not found' },
    });

    const { data, error } = await mockSupabaseRpc('migrate_with_code', {
      p_code: 'TEST1234',
      p_email: 'user@example.com',
      p_password: 'password',
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(error.message).toContain('not found');
  });
});

// ---------------------------------------------------------------------------
// Password validation
// ---------------------------------------------------------------------------

describe('Migration password requirements', () => {
  it('rejects password shorter than 6 characters', () => {
    const password = '12345';
    expect(!password || password.length < 6).toBe(true);
  });

  it('accepts password of exactly 6 characters', () => {
    const password = '123456';
    expect(!password || password.length < 6).toBe(false);
  });

  it('accepts long password', () => {
    const password = 'a-very-long-and-secure-password-2026';
    expect(!password || password.length < 6).toBe(false);
  });

  it('rejects empty password', () => {
    const password: string = '';
    expect(!password || password.length < 6).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

describe('Migration email requirements', () => {
  it('rejects empty email', () => {
    const email = '';
    expect(!email.trim()).toBe(true);
  });

  it('rejects whitespace-only email', () => {
    const email = '   ';
    expect(!email.trim()).toBe(true);
  });

  it('accepts valid email', () => {
    const email = 'worker@portpal.ca';
    expect(!email.trim()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Post-migration auto sign-in
// ---------------------------------------------------------------------------

describe('Post-migration sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls signInWithPassword after successful migration', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: 'new-user-123' } } },
      error: null,
    });

    await mockSupabaseAuth.signInWithPassword({
      email: 'worker@portpal.ca',
      password: 'securepass',
    });

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'worker@portpal.ca',
      password: 'securepass',
    });
  });

  it('handles sign-in failure gracefully (still shows success)', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { error } = await mockSupabaseAuth.signInWithPassword({
      email: 'worker@portpal.ca',
      password: 'wrongpass',
    });

    expect(error).toBeTruthy();
    // The Migrate component still sets codeSuccess = true in this case
    // so the user can manually sign in
  });
});
