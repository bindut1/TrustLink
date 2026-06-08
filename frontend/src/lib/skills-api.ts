/** Canonical skill catalog (GET /skills), cached in-module for the session. */
import { apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type { SkillCatalogItem } from "@/types/issuer";

let cache: Promise<SkillCatalogItem[]> | null = null;

export function fetchSkillCatalog(): Promise<SkillCatalogItem[]> {
  if (!cache) {
    cache = apiRequest<SkillCatalogItem[]>("/skills", {
      token: getAccessToken() ?? undefined,
    }).catch((err) => {
      cache = null; // allow retry on next call
      throw err;
    });
  }
  return cache;
}
