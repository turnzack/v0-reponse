export interface BridgeConfigStatus {
  provider: string;
  configured: boolean;
  keyFingerprint?: string;
  source?: string;
}

const STORAGE_KEY = 'hermes_deepseek_api_key';

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
    // Transmettre au serveur bridge local 5006
    fetch('http://localhost:5006/api/bridge/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key.trim() }),
    }).catch(() => {});
  } catch {}
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.length > 10;
}

export async function checkBridgeConfigStatus(): Promise<BridgeConfigStatus> {
  try {
    const res = await fetch('http://localhost:5006/api/bridge/config');
    if (res.ok) {
      const data = await res.json();
      
      // Si la clé existe localement, on force configured: true même si le backend a oublié
      const localKeyExists = hasApiKey();
      
      return {
        provider: data.provider || 'deepseek',
        configured: localKeyExists || !!data.hasKey || !!data.configured,
        keyFingerprint: data.keyFingerprint || (data.apiKey ? data.apiKey.slice(-4) : (getApiKey()?.slice(-4))),
        source: localKeyExists ? 'local-and-bridge' : (data.source || 'bridge-5006')
      };
    }
  } catch {}

  const hasLocal = hasApiKey();
  const localKey = getApiKey();
  return {
    provider: 'deepseek',
    configured: hasLocal,
    keyFingerprint: localKey ? localKey.slice(-4) : undefined,
    source: 'local-storage'
  };
}

export async function resolveApiKey(): Promise<string | null> {
  const localKey = getApiKey();
  if (localKey && localKey.length > 10) {
    return localKey;
  }

  try {
    const res = await fetch('http://localhost:5006/api/bridge/config');
    if (res.ok) {
      const data = await res.json();
      if (data.hasKey && data.apiKey) {
        setApiKey(data.apiKey);
        return data.apiKey;
      }
    }
  } catch {}

  return null;
}
