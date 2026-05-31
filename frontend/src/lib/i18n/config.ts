// Pure constants — must NOT live in a "use client" module, because constants
// imported from a client module across the server boundary get replaced with
// client-reference proxies (functions), not their string values.

import type { Language } from "./translations";

export const LANG_STORAGE_KEY = "trustlink.lang";
export const LANG_COOKIE_KEY = "trustlink_lang";
export const DEFAULT_LANG: Language = "vi";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
