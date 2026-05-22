import { describe, expect, it, beforeEach } from 'vitest';
import authReducer, {
  logout,
  persistAuthState,
  setCredentials,
  selectCurrentUser,
  selectIsAuthenticated,
} from './authSlice';

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores credentials and marks user as authenticated', () => {
    const state = authReducer(
      undefined,
      setCredentials({
        user: {
          userId: 'user-1',
          email: 'jane@test.com',
          name: 'Jane',
          role: 'User',
        },
        accessToken: 'token-123',
      })
    );

    expect(selectIsAuthenticated({ auth: state })).toBe(true);
    expect(selectCurrentUser({ auth: state })?.email).toBe('jane@test.com');
  });

  it('persists and clears auth in localStorage', () => {
    const loggedIn = authReducer(
      undefined,
      setCredentials({
        user: {
          userId: 'user-1',
          email: 'jane@test.com',
          name: 'Jane',
          role: 'User',
        },
        accessToken: 'token-123',
      })
    );

    persistAuthState(loggedIn);
    expect(localStorage.getItem('ecommerce.auth')).toContain('token-123');

    const loggedOut = authReducer(loggedIn, logout());
    persistAuthState(loggedOut);
    expect(localStorage.getItem('ecommerce.auth')).toBeNull();
    expect(selectIsAuthenticated({ auth: loggedOut })).toBe(false);
  });
});
