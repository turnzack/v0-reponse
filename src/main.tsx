// Kirov5 Sovereign Forge - Release 2.0.0 - Zero-Error SaaS Cloud Firewall
// ═══════════════════════════════════════════════════════════════════
// PARE-FEU RÉSEAU GLOBAL — INTERCEPTEUR DE FETCH LOCALHOST:5006
// Ce bloc s'exécute AVANT React. Il intercepte 100% des appels fetch
// vers le bridge local et les neutralise hors environnement Electron.
// ═══════════════════════════════════════════════════════════════════
(function installNetworkFirewall() {
  const isElectron = typeof window !== 'undefined' && (
    Boolean((window as any).electron) ||
    Boolean((window as any).electronAPI) ||
    (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Electron'))
  );
  
  if (!isElectron && typeof window !== 'undefined') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
      if (url && (url.includes('localhost:500') || url.includes('127.0.0.1:500') || url.includes(':5006'))) {
        // Bloquer silencieusement — retourner null response sans contacter le réseau
        console.debug('[KIROV5-FIREWALL] Blocked local bridge request (Cloud SaaS mode):', url);
        return Promise.resolve(new Response(JSON.stringify({ success: false, blocked: true, mode: 'cloud-saas' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
    console.info('[KIROV5-FIREWALL] ✅ Network firewall active — Cloud SaaS mode (localhost:5006 blocked)');
  }
})();

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AuthScreen from './components/AuthScreen.tsx'
import './index.css'
import './design.css'

interface AuthUser {
  userId: string;
  email: string;
}

function Root() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  // Vérifier la session existante au démarrage
  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem('kirov5_jwt_token');
        if (!token) {
          setChecking(false);
          return;
        }

        const res = await fetch('/api/auth/session', { 
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser({ userId: data.userId, email: data.email });
          }
        } else {
          localStorage.removeItem('kirov5_jwt_token');
        }
      } catch {
        // Pas de serveur auth disponible (mode Desktop local) → laisser passer
        console.warn('[AUTH] Serveur API non disponible — mode local actif');
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  // Écran de chargement initial
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <div style={{ fontSize: '14px' }}>Vérification de la session...</div>
        </div>
      </div>
    );
  }

  // Si pas authentifié → page de login
  if (!user) {
    return <AuthScreen onAuthenticated={(u) => setUser(u)} />;
  }

  // Authentifié → application principale
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
