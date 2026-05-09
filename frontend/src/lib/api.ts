import { formatValidationMessages } from "./format-validation-errors";

const API_BASE_URL =
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

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 0);
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
    let message = `Request failed (${res.status})`;
    let fields: Record<string, string> | undefined;

    if (Array.isArray(raw)) {
      // class-validator returns array of strings — convert to friendly form
      const formatted = formatValidationMessages(raw as string[]);
      message = formatted.summary;
      fields = formatted.fields;
    } else if (typeof raw === "string") {
      message = raw;
    }

    throw new ApiError(message, res.status, fields);
  }

  return data as T;
}
