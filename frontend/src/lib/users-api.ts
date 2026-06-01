/**
 * Current-user (account) API adapter. Avatar upload is multipart, so it hits
 * fetch directly — `apiRequest` is JSON-only.
 */

import { API_BASE_URL, ApiError, apiRequest, networkError, parseUploadError } from "./api";
import { getAccessToken } from "./auth-storage";
import type { AuthUser } from "@/types/auth";

const authOpts = () => ({ token: getAccessToken() ?? undefined });

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append("file", file);

  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw networkError();
  }

  const data = (await res.json().catch(() => ({}))) as {
    message?: unknown;
  } & Partial<AuthUser>;

  if (!res.ok) throw parseUploadError(res, data);
  return data as AuthUser;
}

export function deleteAvatar(): Promise<AuthUser> {
  return apiRequest("/users/me/avatar", { method: "DELETE", ...authOpts() });
}
