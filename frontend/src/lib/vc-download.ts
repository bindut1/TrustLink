import { API_BASE_URL } from "./api";

/**
 * Download a credential's W3C VC JSON-LD via the PUBLIC endpoint (no auth) and
 * trigger a browser save. Used by surfaces where the viewer may not hold the
 * `credential.download` action (recruiters, public verify page) — the signed
 * VC is independently verifiable and contains no secrets.
 */
export async function downloadPublicVc(
  credentialId: string,
  filenameBase: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/public/credentials/${credentialId}/vc`,
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.vc.jsonld`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
