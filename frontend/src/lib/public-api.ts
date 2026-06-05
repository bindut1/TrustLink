/**
 * Public (unauthenticated) API calls — used by the marketing landing page.
 */

import { apiRequest } from "./api";

/** Non-sensitive platform aggregates for the landing stats band. */
export type PublicStats = {
  credentialsOnChain: number;
  partners: number;
  verifiedSkills: number;
  applications: number;
};

export function fetchPublicStats(): Promise<PublicStats> {
  return apiRequest("/public/stats");
}
