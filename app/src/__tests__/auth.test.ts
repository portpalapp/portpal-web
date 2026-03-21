/**
 * Auth module tests - verify AuthProvider and useAuth behavior.
 *
 * Tests mock the Supabase client to verify:
 *   - AuthProvider renders children
 *   - useAuth returns correct session state
 *   - signIn calls supabase.auth.signInWithPassword
 *   - signOut clears session
 *   - demoMode flag
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { mockSupabaseAuth } from '../test/setup';

// A simple component that displays auth state for testing
function AuthDisplay() {
  const { user, loading, demoMode, session } = useAuth();
  return createElement('div', null,
    createElement('span', { 'data-testid': 'loading' }, String(loading)),
    createElement('span', { 'data-testid': 'user' }, user ? user.id : 'null'),
    createElement('span', { 'data-testid': 'demo' }, String(demoMode)),
    createElement('span', { 'data-testid': 'session' }, session ? 'active' : 'null'),
  );
}

// A component that calls auth methods for testing
function AuthActions() {
  const { signIn, signOut, enterDemoMode, demoMode } = useAuth();
  return createElement('div', null,
    createElement('button', {
      'data-testid': 'sign-in',
      onClick: () => signIn('test@portpal.ca', 'password123'),
    }, 'Sign In'),
    createElement('button', {
      'data-testid': 'sign-out',
      onClick: () => signOut(),
    }, 'Sign Out'),
    createElement('button', {
      'data-testid': 'enter-demo',
      onClick: () => enterDemoMode(),
    }, 'Demo'),
    createElement('span', { 'data-testid': 'demo-state' }, String(demoMode)),
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('renders children', async () => {
    render(
      createElement(AuthProvider, null,
        createElement('div', { 'data-testid': 'child' }, 'Hello'),
      ),
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').textContent).toBe('Hello');
  });

  it('starts in loading state', () => {
    // Make getSession hang so loading stays true
    mockSupabaseAuth.getSession.mockReturnValue(new Promise(() => {}));

    render(
      createElement(AuthProvider, null,
        createElement(AuthDisplay),
      ),
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('resolves to no user when session is null', async () => {
    render(
      createElement(AuthProvider, null,
        createElement(AuthDisplay),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('session').textContent).toBe('null');
  });

  it('resolves to user when session exists', async () => {
    const fakeSession = {
      user: { id: 'user-123', email: 'worker@portpal.ca' },
      access_token: 'fake-token',
    };
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    render(
      createElement(AuthProvider, null,
        createElement(AuthDisplay),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('user-123');
    expect(screen.getByTestId('session').textContent).toBe('active');
  });

  it('demoMode defaults to false', async () => {
    render(
      createElement(AuthProvider, null,
        createElement(AuthDisplay),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('demo').textContent).toBe('false');
  });
});

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('calls supabase.auth.signInWithPassword with correct credentials', async () => {
    render(
      createElement(AuthProvider, null,
        createElement(AuthActions),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('sign-in')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('sign-in').click();
    });

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@portpal.ca',
      password: 'password123',
    });
  });
});

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const fakeSession = {
      user: { id: 'user-123', email: 'worker@portpal.ca' },
      access_token: 'fake-token',
    };
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
  });

  it('calls supabase.auth.signOut', async () => {
    render(
      createElement(AuthProvider, null,
        createElement(AuthActions),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('sign-out')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('sign-out').click();
    });

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });
});

describe('demoMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('enterDemoMode sets demoMode to true', async () => {
    render(
      createElement(AuthProvider, null,
        createElement(AuthActions),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('demo-state').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByTestId('enter-demo').click();
    });

    expect(screen.getByTestId('demo-state').textContent).toBe('true');
  });

  it('signOut resets demoMode to false', async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    render(
      createElement(AuthProvider, null,
        createElement(AuthActions),
      ),
    );

    // Enter demo mode
    await waitFor(() => {
      expect(screen.getByTestId('demo-state').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByTestId('enter-demo').click();
    });
    expect(screen.getByTestId('demo-state').textContent).toBe('true');

    // Sign out should reset it
    await act(async () => {
      screen.getByTestId('sign-out').click();
    });
    expect(screen.getByTestId('demo-state').textContent).toBe('false');
  });
});

describe('useAuth default context', () => {
  it('returns default values when used outside AuthProvider', () => {
    // useAuth outside provider returns the default context values
    let authState: ReturnType<typeof useAuth> | null = null;

    function Capture() {
      authState = useAuth();
      return null;
    }

    render(createElement(Capture));

    expect(authState).not.toBeNull();
    expect(authState!.session).toBeNull();
    expect(authState!.user).toBeNull();
    expect(authState!.loading).toBe(true);
    expect(authState!.demoMode).toBe(false);
  });
});
