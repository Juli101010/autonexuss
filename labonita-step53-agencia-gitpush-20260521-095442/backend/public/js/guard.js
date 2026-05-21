/**
 * Route guard: blocks access to protected pages if not logged in.
 * Uses /api/auth/me (cookie session).
 */
import { api } from './api.js';

export async function requireAuth({ redirectTo = '/login.html', minRole = null } = {}) {
  try {
    const me = await api('/auth/me');
    if (minRole && String(me.role||'').toUpperCase() !== String(minRole).toUpperCase()) {
      window.location.href = redirectTo;
      return null;
    }
    return me;
  } catch {
    window.location.href = redirectTo;
    return null;
  }
}
