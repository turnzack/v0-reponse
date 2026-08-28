// Client Moteur Bridge Souverain
// Gestionnaire sécurisé pour la version 100% Web Cloud (Vercel + Cloudflare)

let isLocalBridgeAvailable = true;
let lastFailureTimestamp = 0;

/**
 * Exécute une requête vers le bridge local (port 5006) de façon sécurisée.
 * Si le bridge local est hors ligne (sur mobile ou un PC distant), la requête est coupée silencieusement 
 * pour éviter les erreurs ERR_CONNECTION_REFUSED dans la console.
 */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const now = Date.now();
  // Si le bridge local s'est avéré hors ligne dans les 15 dernières secondes, on coupe immédiatement
  if (!isLocalBridgeAvailable && (now - lastFailureTimestamp < 15000)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    clearTimeout(timer);
    isLocalBridgeAvailable = true;
    return res;
  } catch {
    isLocalBridgeAvailable = false;
    lastFailureTimestamp = Date.now();
    return null;
  }
}
