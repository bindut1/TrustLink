import type { AuthResponse, AuthUser } from "@/types/auth";

const ACCESS_KEY = "trustlink.accessToken";
const REFRESH_KEY = "trustlink.refreshToken";
const USER_KEY = "trustlink.user";

/**
 * Dispatched on `window` whenever the stored user changes, so in-tab listeners
 * (e.g. `useCurrentUser`) can re-read immediately. The native `storage` event
 * only fires in *other* tabs, not the one that wrote — hence this companion.
 */
export const USER_CHANGED_EVENT = "trustlink:user-changed";

function emitUserChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_CHANGED_EVENT));
}

export function saveSession({ user, accessToken, refreshToken }: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitUserChanged();
}

/**
 * Merge a partial patch into the stored user and notify listeners. Used after
 * profile mutations (e.g. avatar upload) so the shell reflects the change
 * without a full reload. No-op if there is no stored user.
 */
export function updateStoredUser(patch: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  const current = getCurrentUser();
  if (!current) return;
  const next = { ...current, ...patch };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitUserChanged();
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  emitUserChanged();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
