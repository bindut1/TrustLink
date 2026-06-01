import {
  formatValidationMessages,
  localizeBackendMessage,
  statusFallbackMessage,
} from "./format-validation-errors";
import type { Language } from "./i18n/translations";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type Json = Record<string, unknown> | unknown[];

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Json;
  token?: string;
};

const NETWORK_ERROR: Record<Language, string> = {
  en: "Cannot reach the server. Please try again.",
  vi: "Không kết nối được tới máy chủ. Vui lòng thử lại.",
};

/**
 * Read the current UI language straight from localStorage. `LanguageProvider`
 * is the writer; reading directly here avoids threading React context through
 * every API call. Defaults to "vi" (system default) when unavailable.
 */
function currentLanguage(): Language {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem("trustlink.lang");
  return stored === "en" || stored === "vi" ? stored : "vi";
}

/**
 * Shared error parser for direct `fetch()` multipart calls (avatar, batch
 * upload). Mirrors the same localization logic as `apiRequest` so these
 * bypassed endpoints produce consistent, user-friendly messages.
 */
export function parseUploadError(
  res: Response,
  payload: { message?: unknown },
): ApiError {
  const lang = currentLanguage();
  const raw = payload.message;
  let message = statusFallbackMessage(res.status, lang);

  if (Array.isArray(raw)) {
    message = formatValidationMessages(raw as string[], lang).summary;
  } else if (typeof raw === "string") {
    const isGenericHttpDefault =
      /^(Forbidden|Unauthorized|Internal Server Error)$/i.test(raw);
    message = isGenericHttpDefault
      ? statusFallbackMessage(res.status, lang)
      : localizeBackendMessage(raw, lang);
  }

  return new ApiError(message, res.status);
}

export function networkError(): ApiError {
  const lang = currentLanguage();
  return new ApiError(NETWORK_ERROR[lang], 0);
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const lang = currentLanguage();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR[lang], 0);
  }

  if (res.status === 204) return undefined as T;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const payload = (data ?? {}) as { message?: unknown; error?: unknown };
    const raw = payload.message ?? payload.error;
    let message = statusFallbackMessage(res.status, lang);
    let fields: Record<string, string> | undefined;

    if (Array.isArray(raw)) {
      const formatted = formatValidationMessages(raw as string[], lang);
      message = formatted.summary;
      fields = formatted.fields;
    } else if (typeof raw === "string") {
      const localized = localizeBackendMessage(raw, lang);
      // Only use the localized message if it differs from the raw string (i.e.
      // was actually translated) OR if it's not a generic NestJS default like
      // "Forbidden" / "Unauthorized" that we handle better via status code.
      const isGenericHttpDefault =
        /^(Forbidden|Unauthorized|Internal Server Error)$/i.test(raw);
      message = isGenericHttpDefault ? statusFallbackMessage(res.status, lang) : localized;
    }

    throw new ApiError(message, res.status, fields);
  }

  return data as T;
}
