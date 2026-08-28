// Client Moteur Bridge Souverain
// Gestionnaire sécurisé pour la version 100% Web Cloud (Vercel + Cloudflare)

let isLocalBridgeAvailable = true;
let lastFailureTimestamp = 0;

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || Boolean((window as any).electron || (window as any).electronAPI);
}

/**
 * Exécute une requête vers le bridge local (port 5006) de façon sécurisée.
 * Si le bridge local est hors ligne ou si l'application tourne en mode Cloud (Vercel/Web), 
 * la requête est évitée avant d'être émise pour zéro erreur ERR_CONNECTION_REFUSED.
 */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  // En mode Cloud SaaS (ex: Vercel / mobile), ne pas tenter d'appeler le port local 5006
  if (url.includes('localhost:500') || url.includes('127.0.0.1:500')) {
    if (!isLocalEnvironment()) {
      return null;
    }
  }

  const now = Date.now();
  // Si le bridge local s'est avéré hors ligne dans les 60 dernières secondes, on coupe immédiatement
  if (!isLocalBridgeAvailable && (now - lastFailureTimestamp < 60000)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);

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
