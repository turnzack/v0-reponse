import React, { useState, useEffect } from 'react';

const AdminDesignApp = () => {
  const [activeZone, setActiveZone] = useState('global');
  
  const [design, setDesign] = useState({
    appLargeurMax: "100vw",
    appHauteurMax: "100vh",
    headerHauteur: "72px",
    appBgTop: "#0f0f0f",
    appBgBottom: "#000000",
    couleurTextePrincipal: "#ffffff",
    couleurAccentCyan: "#08b3c9",
    couleurAccentRose: "#e274a9",
    fontPrincipale: "'Inter', sans-serif",
    tailleTexteBase: "14px",
    arrondiGlobal: "12px",
    headerBgCouleur: "rgba(0, 0, 0, 0.4)",
    btnEnvoiBg: "#08b3c9",
    chatConteneurBg: "rgba(0, 0, 0, 0.6)"
  });

  const generateCSS = (d: typeof design) => {
    return `/* Tiger IA Design - Admin Studio */
:root {
  /* Architecture */
  --app-largeur-max: ${d.appLargeurMax};
  --app-hauteur-max: ${d.appHauteurMax};
  --header-hauteur: ${d.headerHauteur};
  
  /* Couleurs Globales */
  --app-bg-top: ${d.appBgTop};
  --app-bg-bottom: ${d.appBgBottom};
  --couleur-texte-principal: ${d.couleurTextePrincipal};
  --couleur-accent-cyan: ${d.couleurAccentCyan};
  --couleur-accent-rose: ${d.couleurAccentRose};
  
  /* Typographie & Arrondis */
  --font-principale: ${d.fontPrincipale};
  --taille-texte-base: ${d.tailleTexteBase};
  --arrondi-global: ${d.arrondiGlobal};
  
  /* Composants */
  --header-bg-couleur: ${d.headerBgCouleur};
  --btn-envoi-bg: ${d.btnEnvoiBg};
  --chat-conteneur-bg: ${d.chatConteneurBg};
  
  /* Alias Compatibilité */
  --color-primary: ${d.couleurAccentCyan};
  --color-bg: ${d.appBgBottom};
  --color-text: ${d.couleurTextePrincipal};
  --radius: ${d.arrondiGlobal};
  --font-base: ${d.tailleTexteBase};
}

body { 
  background: linear-gradient(to bottom right, var(--app-bg-top), var(--app-bg-bottom)) !important; 
  color: var(--couleur-texte-principal) !important; 
  font-family: var(--font-principale) !important; 
  font-size: var(--taille-texte-base) !important;
  min-height: 125vh;
  margin: 0;
  zoom: 0.8;
  overflow-x: hidden;
}
button, input, select, textarea, .arrondi { border-radius: var(--arrondi-global) !important; }
.bg-cyan { background-color: var(--couleur-accent-cyan) !important; }
.bg-rose { background-color: var(--couleur-accent-rose) !important; }
.header-custom { height: var(--header-hauteur) !important; background: var(--header-bg-couleur) !important; }
.chat-custom { background: var(--chat-conteneur-bg) !important; }
`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Écriture dynamique dans le projet v0-interface-versel pour appliquer les styles
      fetch("http://localhost:5005/api/fs/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: "../../v0-interface-versel", file: "src/design.css", content: generateCSS(design) })
      }).catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [design]);

  const handleChange = (key: keyof typeof design, value: string) => {
    setDesign(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan to-pink-500">TIGER ADMIN STUDIO</h1>
        </div>
        <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full text-gray-300 border border-white/5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Synchronisation HMR Active
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: VISUAL SELECTOR */}
        <div className="w-1/2 p-8 flex flex-col items-center justify-center border-r border-white/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent relative">
          <h2 className="absolute top-8 left-8 text-sm font-bold text-gray-500 tracking-widest uppercase">1. Sélectionnez une zone</h2>
          
          <div className="w-full max-w-2xl aspect-video bg-black/80 rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden flex flex-col group mt-8">
            
            {/* Header Zone */}
            <div 
              onClick={() => setActiveZone('header')}
              className={`h-12 border-b border-white/10 flex items-center px-4 cursor-pointer transition-all ${activeZone === 'header' ? 'bg-cyan/20 border-cyan shadow-[inset_0_0_20px_rgba(8,179,201,0.5)]' : 'hover:bg-white/5'}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/10"></div>
              <div className="ml-3 w-24 h-4 bg-white/20 rounded"></div>
              <div className="ml-auto text-xs font-bold text-cyan opacity-0 group-hover:opacity-100 transition-opacity">HEADER</div>
            </div>

            <div className="flex-1 flex relative">
              {/* Sidebar Zone */}
              <div 
                onClick={() => setActiveZone('global')}
                className={`w-16 border-r border-white/10 flex flex-col items-center py-4 gap-3 cursor-pointer transition-all ${activeZone === 'global' ? 'bg-pink-500/20 border-pink-500 shadow-[inset_0_0_20px_rgba(236,72,153,0.5)]' : 'hover:bg-white/5'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan/80"></div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/80"></div>
                <div className="w-10 h-10 rounded-xl bg-yellow-400/80"></div>
              </div>

              {/* Main Area */}
              <div 
                onClick={() => setActiveZone('global')}
                className={`flex-1 p-6 cursor-pointer transition-all flex flex-col justify-center items-center ${activeZone === 'global' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <h2 className="text-xl font-black mb-4 text-white/50 tracking-widest">ZONE GLOBALE</h2>
                <div className="w-full h-32 bg-black/50 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                  <span className="text-white/20 font-mono text-sm">Contenu Principal</span>
                </div>
              </div>

              {/* Chat Zone */}
              <div 
                onClick={() => setActiveZone('chat')}
                className={`w-64 border-l border-white/10 flex flex-col p-4 cursor-pointer transition-all ${activeZone === 'chat' ? 'bg-purple-500/20 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.5)]' : 'hover:bg-white/5'}`}
              >
                <div className="text-xs font-bold text-purple-400 mb-4 opacity-0 group-hover:opacity-100 transition-opacity text-center">PANNEAU CHAT</div>
                <div className="flex-1 space-y-3">
                  <div className="w-3/4 h-10 bg-white/10 rounded-xl rounded-tl-sm"></div>
                  <div className="w-3/4 h-10 bg-cyan/20 rounded-xl rounded-tr-sm self-end ml-auto"></div>
                </div>
                <div className="h-10 w-full rounded-xl bg-cyan flex items-center justify-center mt-4">
                  <span className="text-black font-bold text-xs">Bouton Envoi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="w-1/2 bg-[#0a0a0a] p-8 overflow-y-auto relative">
          <h2 className="absolute top-8 left-8 text-sm font-bold text-gray-500 tracking-widest uppercase">2. Ajustez les paramètres</h2>
          
          <div className="mt-12">
            <h2 className="text-3xl font-black mb-8 text-white flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                {activeZone === 'global' ? '🎨 Global & Accents' : activeZone === 'header' ? '📏 Header' : '💬 Chat & Interactions'}
              </span>
            </h2>
            
            <div className="space-y-6">
              {activeZone === 'global' && (
                <div className="animate-fadeIn space-y-6">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg hover:border-white/20 transition-all">
                    <h3 className="font-bold text-gray-300 border-b border-white/10 pb-2">Arrière-plans</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur Haut (Gradient)</label>
                        <input type="color" value={design.appBgTop} onChange={(e) => handleChange('appBgTop', e.target.value)} className="w-full h-12 rounded cursor-pointer bg-black/50 border border-white/10" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur Bas (Gradient)</label>
                        <input type="color" value={design.appBgBottom} onChange={(e) => handleChange('appBgBottom', e.target.value)} className="w-full h-12 rounded cursor-pointer bg-black/50 border border-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg hover:border-white/20 transition-all">
                    <h3 className="font-bold text-gray-300 border-b border-white/10 pb-2">Accents Thématiques</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Accent Cyan</label>
                        <input type="color" value={design.couleurAccentCyan} onChange={(e) => handleChange('couleurAccentCyan', e.target.value)} className="w-full h-12 rounded cursor-pointer bg-black/50 border border-cyan/30" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Accent Rose</label>
                        <input type="color" value={design.couleurAccentRose} onChange={(e) => handleChange('couleurAccentRose', e.target.value)} className="w-full h-12 rounded cursor-pointer bg-black/50 border border-pink-500/30" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg hover:border-white/20 transition-all">
                    <h3 className="font-bold text-gray-300 border-b border-white/10 pb-2">Typographie & Formes</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Police Principale</label>
                        <select value={design.fontPrincipale} onChange={(e) => handleChange('fontPrincipale', e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors">
                          <option value="'Inter', sans-serif">Inter</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Outfit', sans-serif">Outfit</option>
                          <option value="'Consolas', monospace">Monospace</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Arrondis Global</label>
                        <input type="range" min="0" max="40" step="2" value={parseInt(design.arrondiGlobal)} onChange={(e) => handleChange('arrondiGlobal', `${e.target.value}px`)} className="w-full accent-pink-500 mt-2" />
                        <div className="text-right text-xs text-pink-500 font-bold mt-1">{design.arrondiGlobal}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeZone === 'header' && (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 animate-fadeIn shadow-lg hover:border-white/20 transition-all">
                  <h3 className="font-bold text-gray-300 border-b border-white/10 pb-2">Configuration du Header</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hauteur du Header (px)</label>
                      <input type="text" value={design.headerHauteur} onChange={(e) => handleChange('headerHauteur', e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur de fond (HEX ou RGBA)</label>
                      <input type="text" value={design.headerBgCouleur} onChange={(e) => handleChange('headerBgCouleur', e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors" />
                    </div>
                  </div>
                </div>
              )}

              {activeZone === 'chat' && (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 animate-fadeIn shadow-lg hover:border-white/20 transition-all">
                  <h3 className="font-bold text-gray-300 border-b border-white/10 pb-2">Chat IA & Boutons</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur du Conteneur Chat (RGBA)</label>
                      <input type="text" value={design.chatConteneurBg} onChange={(e) => handleChange('chatConteneurBg', e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur du Bouton Envoi (HEX)</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={design.btnEnvoiBg} onChange={(e) => handleChange('btnEnvoiBg', e.target.value)} className="w-12 h-12 rounded cursor-pointer bg-black/50 border border-white/10 shrink-0" />
                        <input type="text" value={design.btnEnvoiBg} onChange={(e) => handleChange('btnEnvoiBg', e.target.value)} className="w-full bg-black border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDesignApp;
