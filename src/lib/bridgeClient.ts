// Client Moteur Bridge Souverain
// Gestionnaire sécurisé pour la version 100% Web Cloud (Vercel + Cloudflare) et Local Dev

let isLocalBridgeAvailable: boolean | null = null;
let lastFailureTimestamp = 0;
let probePromise: Promise<boolean> | null = null;

export function isElectronEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).electron || 
    (window as any).electronAPI || 
    navigator.userAgent?.includes('Electron')
  );
}

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || isElectronEnvironment();
}

/**
 * Teste rapidement si le bridge local 5006 est en écoute avec dédoublonnement.
 */
export async function probeLocalBridge(): Promise<boolean> {
  if (isLocalBridgeAvailable !== null) {
    if (isLocalBridgeAvailable === false) {
      if (Date.now() - lastFailureTimestamp < 15000) {
        return false;
      }
    } else {
      return true;
    }
  }

  if (probePromise) return probePromise;

  probePromise = (async () => {
    try {
      if (!isLocalEnvironment()) {
        isLocalBridgeAvailable = false;
        return false;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      const res = await fetch('http://localhost:5006/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => null);
      clearTimeout(timer);

      if (res && (res.ok || res.status === 200)) {
        isLocalBridgeAvailable = true;
        return true;
      }
    } catch {}
    
    isLocalBridgeAvailable = false;
    lastFailureTimestamp = Date.now();
    return false;
  })();

  try {
    return await probePromise;
  } finally {
    probePromise = null;
  }
}

/**
 * Exécute une requête vers le bridge local (port 5006/5005) de façon sécurisée.
 * En mode local (navigateur localhost ou Electron), la requête est émise vers le moteur.
 * Si le bridge distant (pur Vercel Cloud SaaS) est utilisé, la requête est évitée avant d'être émise.
 */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const isLocalTarget = url.includes('localhost:500') || url.includes('127.0.0.1:500') || url.includes(':5006');

  if (isLocalTarget) {
    // Si on est en environnement cloud pur (ex: hébergé sur Vercel sans machine locale), bloquer
    if (!isLocalEnvironment()) {
      return null;
    }

    if (isLocalBridgeAvailable === false) {
      const now = Date.now();
      if (now - lastFailureTimestamp < 15000) { // Ne retenter qu'après 15 secondes
        return null;
      }
    }

    if (isLocalBridgeAvailable === null) {
      const isOk = await probeLocalBridge();
      if (!isOk) return null;
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      ...init,
      signal: init?.signal || controller.signal
    });

    clearTimeout(timer);
    if (isLocalTarget) {
      isLocalBridgeAvailable = true;
    }
    return res;
  } catch {
    if (isLocalTarget) {
      isLocalBridgeAvailable = false;
      lastFailureTimestamp = Date.now();
    }
    return null;
  }
}
