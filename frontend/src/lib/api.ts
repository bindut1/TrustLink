import {
  formatValidationMessages,
  localizeBackendMessage,
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

const REQUEST_FAILED: Record<Language, (status: number) => string> = {
  en: (status) => `Request failed (${status})`,
  vi: (status) => `Yêu cầu thất bại (${status})`,
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
    let message = REQUEST_FAILED[lang](res.status);
    let fields: Record<string, string> | undefined;

    if (Array.isArray(raw)) {
      const formatted = formatValidationMessages(raw as string[], lang);
      message = formatted.summary;
      fields = formatted.fields;
    } else if (typeof raw === "string") {
      message = localizeBackendMessage(raw, lang);
    }

    throw new ApiError(message, res.status, fields);
  }

  return data as T;
}
