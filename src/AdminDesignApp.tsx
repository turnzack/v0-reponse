import React, { useState, useEffect } from 'react';
import defaultDesign from './design-tokens.json';

const categories = {
  '1. ARCHITECTURE': ['appLargeurMax', 'appHauteurMax', 'sidebarDroitePosition', 'sidebarDroiteTop', 'sidebarDroiteBas', 'sidebarDroiteLargeur'],
  '2. FONDS & COULEURS': ['appBgTop', 'appBgBottom', 'couleurTextePrincipal', 'couleurTexteSecondaire', 'couleurAccentCyan', 'couleurAccentRose', 'couleurAccentVert', 'couleurAccentViolet', 'flouGlobalArrierePlan'],
  '3. TYPOGRAPHIE': ['fontPrincipale', 'fontTitre', 'fontCode', 'tailleTexteNano', 'tailleTexteMini', 'tailleTexteBase', 'tailleTexteTitre', 'tailleTexteGeant'],
  '4. EN-TÊTE': ['headerPosition', 'headerTop', 'headerLeft', 'headerLargeur', 'headerZIndex', 'headerHauteur', 'headerPadding', 'headerBgCouleur', 'headerBordureBas', 'headerOmbre', 'logoTaille', 'logoArrondi', 'logoBgCouleur', 'logoOmbre', 'logoEmojiTaille', 'titrePoids', 'titreCouleur', 'titreEspacement', 'sousTitreCouleur', 'sousTitrePoids'],
  '5. MENU ACCUEIL': ['iconeReglagesBg', 'iconeAssistantBg', 'iconeProjetsBg', 'iconePacksBg', 'iconeActualitesBg', 'grilleDisplay', 'grilleFlexWrap', 'grilleJustify', 'grilleOverflowX', 'carteCarrouselHauteur', 'carteCarrouselLargeur', 'grilleMaxLargeur', 'grilleMargeHaut', 'grilleMargeBas', 'grilleGapX', 'grilleGapY', 'appIconeLargeur', 'appIconeHauteur', 'appIconeArrondi', 'appIconeBordure', 'appIconeOmbre', 'appIconeOmbreSurvol', 'appIconeScaleSurvol', 'appIconeEmojiTaille', 'appIconeTransition', 'appTexteTaille', 'appTexteCouleur', 'appTextePoids', 'appTexteMargeHaut'],
  '6. CHAT & FOOTER': ['footerPosition', 'footerBas', 'footerGauche', 'footerLargeur', 'footerZIndex', 'chatLayoutGap', 'chatBullesEspacement', 'chatSeparateurMargeY', 'chatMainPosition', 'chatMainTop', 'chatMainBottom', 'chatMainRight', 'chatMainWidth', 'chatConteneurBg', 'chatConteneurFlou', 'chatConteneurBordureHaut', 'chatConteneurPaddingHaut', 'chatConteneurPaddingBas', 'chatConteneurPaddingX', 'statutPadding', 'statutBg', 'statutBordureBas', 'statutGap', 'statutTexteTaille', 'statutTextePoids', 'statutTexteEspacement', 'statutPastilleTaille', 'inputHauteur', 'inputLargeur', 'inputBgCouleur', 'inputBordureCouleur', 'inputTexteTaille', 'inputTexteCouleur', 'inputPlaceholderCouleur', 'inputArrondi', 'inputPaddingGauche', 'inputPaddingDroite', 'inputOmbreInterne', 'btnEnvoiPosition', 'btnEnvoiTop', 'btnEnvoiBottom', 'btnEnvoiLeft', 'btnEnvoiRight', 'btnEnvoiTaille', 'btnEnvoiBg', 'btnEnvoiCouleur', 'btnEnvoiArrondi', 'btnEnvoiIconeTaille', 'trombonePosition', 'tromboneTop', 'tromboneBottom', 'tromboneLeft', 'tromboneRight', 'tromboneTaille', 'tromboneCouleur', 'tromboneMargin', 'newV0Position', 'newV0Top', 'newV0Bottom', 'newV0Left', 'newV0Right', 'newV0Padding', 'newV0Taille', 'newV0Bg', 'newV0Couleur', 'newV0Arrondi', 'newV0Bordure', 'newV0Margin'],
  '7. IDE ESPACE TRAVAIL': ['ideToolbarHauteur', 'ideToolbarBg', 'ideToolbarBordure', 'ideBtnActionTaille', 'ideBtnActionArrondi', 'ideBtnActionBg', 'ideBtnActionBordure', 'ideBtnActionEmoji', 'explorateurLargeur', 'explorateurBg', 'explorateurBordureDroite', 'explorateurTexteTaille', 'explorateurDossierCouleur', 'explorateurFichierCouleur', 'editeurBg', 'editeurOngletHauteur', 'editeurOngletBg', 'editeurOngletBordure', 'previewBg', 'previewLargeur', 'previewBordureGauche'],
  '8. MOUCHARD': ['mouchardBg', 'mouchardBordureGauche', 'mouchardOmbre', 'mouchardEnteteBg', 'mouchardEnteteHauteur', 'mouchardTitreCouleur', 'mouchardTexteTaille', 'mouchardTexteCouleurDefaut', 'mouchardTexteCouleurErreur'],
  '9. MODALES': ['modalFondAssombrissement', 'modalFondFlou', 'modalLargeurMax', 'modalHauteurMax', 'modalBgTop', 'modalBgBottom', 'modalBordure', 'modalArrondi', 'modalOmbre', 'modalPrdBg', 'modalPrdBordure', 'modalPrdEnteteBg', 'modalPrdTitreCouleur', 'modalSidebarLargeur', 'modalSidebarBg', 'modalOngletPadding', 'modalOngletArrondi', 'modalOngletGap', 'modalOngletBgActif', 'modalOngletBordureActif', 'modalOngletCouleurActif', 'modalOngletCouleurInactif']
};

const AdminDesignApp = () => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(categories)[0]);
  const [design, setDesign] = useState(defaultDesign);
  const [lockedSettings, setLockedSettings] = useState<Record<string, boolean>>({});

  const formatKeyToCSSVar = (key: string) => {
    return '--' + key.replace(/([A-Z])/g, "-$1").toLowerCase();
  };

  const generateCSS = (d: typeof defaultDesign) => {
    let cssVars = '';
    for (const [key, value] of Object.entries(d)) {
      cssVars += `  ${formatKeyToCSSVar(key)}: ${value};\n`;
    }
    
    return `/* Tiger IA Design - Admin Studio FULL */
:root {
${cssVars}
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

/* Applications Utilitaires Automatiques */
.design-app-root {
   background: linear-gradient(to bottom right, var(--app-bg-top), var(--app-bg-bottom)) !important;
   font-family: var(--font-principale) !important;
   width: var(--app-largeur-max) !important;
   height: var(--app-hauteur-max) !important;
}

.design-header {
   position: var(--header-position) !important;
   top: var(--header-top) !important;
   left: var(--header-left) !important;
   width: var(--header-largeur) !important;
   z-index: var(--header-z-index) !important;
   height: var(--header-hauteur) !important;
   padding: var(--header-padding) !important;
   background: var(--header-bg-couleur) !important;
   border-bottom: var(--header-bordure-bas) !important;
   box-shadow: var(--header-ombre) !important;
}

.design-logo {
   width: var(--logo-taille) !important;
   height: var(--logo-taille) !important;
   border-radius: var(--logo-arrondi) !important;
   background: var(--logo-bg-couleur) !important;
   box-shadow: var(--logo-ombre) !important;
   font-size: var(--logo-emoji-taille) !important;
}

.design-titre {
   font-size: var(--taille-texte-titre) !important;
   font-weight: var(--titre-poids) !important;
   color: var(--titre-couleur) !important;
   letter-spacing: var(--titre-espacement) !important;
   font-family: var(--font-titre) !important;
}

.design-sous-titre {
   font-size: var(--taille-texte-base) !important;
   color: var(--sous-titre-couleur) !important;
   font-weight: var(--sous-titre-poids) !important;
}

.design-grille {
   display: var(--grille-display) !important;
   flex-wrap: var(--grille-flex-wrap) !important;
   justify-content: var(--grille-justify) !important;
   overflow-x: var(--grille-overflow-x) !important;
   max-width: var(--grille-max-largeur) !important;
   margin-top: var(--grille-marge-haut) !important;
   margin-bottom: var(--grille-marge-bas) !important;
   gap: var(--grille-gap-x) var(--grille-gap-y) !important;
}

.design-app-icone {
   width: var(--app-icone-largeur) !important;
   height: var(--app-icone-hauteur) !important;
   border-radius: var(--app-icone-arrondi) !important;
   border: var(--app-icone-bordure) !important;
   font-size: var(--app-icone-emoji-taille) !important;
   transition: var(--app-icone-transition) !important;
   box-shadow: var(--app-icone-ombre) !important;
}

.design-icone-reglages { background: var(--icone-reglages-bg) !important; }
.design-icone-assistant { background: var(--icone-assistant-bg) !important; }
.design-icone-projets { background: var(--icone-projets-bg) !important; }
.design-icone-packs { background: var(--icone-packs-bg) !important; }
.design-icone-actualites { background: var(--icone-actualites-bg) !important; }

.design-app-icone:hover {
   box-shadow: var(--app-icone-ombre-survol) !important;
   transform: scale(var(--app-icone-scale-survol)) !important;
}

.design-app-texte {
   font-size: var(--app-texte-taille) !important;
   color: var(--app-texte-couleur) !important;
   font-weight: var(--app-texte-poids) !important;
   margin-top: var(--app-texte-marge-haut) !important;
}

.design-footer {
   position: var(--footer-position) !important;
   bottom: var(--footer-bas) !important;
   left: var(--footer-gauche) !important;
   width: var(--footer-largeur) !important;
   z-index: var(--footer-z-index) !important;
   background: var(--chat-conteneur-bg) !important;
   border-top: var(--chat-conteneur-bordure-haut) !important;
}

.design-chat-main {
   position: var(--chat-main-position) !important;
   top: var(--chat-main-top) !important;
   bottom: var(--chat-main-bottom) !important;
   right: var(--chat-main-right) !important;
   width: var(--chat-main-width) !important;
}

.design-chat-layout {
   gap: var(--chat-layout-gap) !important;
}

.design-chat-bulles {
   gap: var(--chat-bulles-espacement) !important;
}

.design-carte-carrousel {
   height: var(--carte-carrousel-hauteur) !important;
   width: var(--carte-carrousel-largeur) !important;
}

.design-chat-separateur {
   margin-top: var(--chat-separateur-marge-y) !important;
   margin-bottom: var(--chat-separateur-marge-y) !important;
}

.design-chat-input {
   height: var(--input-hauteur) !important;
   width: var(--input-largeur) !important;
   background: var(--input-bg-couleur) !important;
   border: var(--input-bordure-couleur) !important;
   font-size: var(--input-texte-taille) !important;
   color: var(--input-texte-couleur) !important;
   border-radius: var(--input-arrondi) !important;
   padding-left: var(--input-padding-gauche) !important;
   padding-right: var(--input-padding-droite) !important;
   box-shadow: var(--input-ombre-interne) !important;
}

.design-chat-input::placeholder {
   color: var(--input-placeholder-couleur) !important;
}

.design-btn-envoi {
   position: var(--btn-envoi-position) !important;
   top: var(--btn-envoi-top) !important;
   bottom: var(--btn-envoi-bottom) !important;
   left: var(--btn-envoi-left) !important;
   right: var(--btn-envoi-right) !important;
   width: var(--btn-envoi-taille) !important;
   height: var(--btn-envoi-taille) !important;
   background: var(--btn-envoi-bg) !important;
   color: var(--btn-envoi-couleur) !important;
   border-radius: var(--btn-envoi-arrondi) !important;
   font-size: var(--btn-envoi-icone-taille) !important;
}

.design-btn-trombone {
   position: var(--trombone-position) !important;
   top: var(--trombone-top) !important;
   bottom: var(--trombone-bottom) !important;
   left: var(--trombone-left) !important;
   right: var(--trombone-right) !important;
   font-size: var(--trombone-taille) !important;
   color: var(--trombone-couleur) !important;
   margin: var(--trombone-margin) !important;
}

.design-btn-new-v0 {
   position: var(--new-v0-position) !important;
   top: var(--new-v0-top) !important;
   bottom: var(--new-v0-bottom) !important;
   left: var(--new-v0-left) !important;
   right: var(--new-v0-right) !important;
   padding: var(--new-v0-padding) !important;
   font-size: var(--new-v0-taille) !important;
   background: var(--new-v0-bg) !important;
   color: var(--new-v0-couleur) !important;
   border-radius: var(--new-v0-arrondi) !important;
   border: var(--new-v0-bordure) !important;
   margin: var(--new-v0-margin) !important;
}

.design-mouchard-conteneur {
   position: var(--sidebar-droite-position) !important;
   top: var(--sidebar-droite-top) !important;
   bottom: var(--sidebar-droite-bas) !important;
   width: var(--sidebar-droite-largeur) !important;
   background: var(--mouchard-bg) !important;
   border-left: var(--mouchard-bordure-gauche) !important;
   box-shadow: var(--mouchard-ombre) !important;
}
`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("http://localhost:5005/api/fs/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: "../../v0-interface-versel", file: "src/design.css", content: generateCSS(design) })
      }).catch(console.error);
    }, 150); // Plus rapide pour une sensation temps-réel absolue
    return () => clearTimeout(timer);
  }, [design]);

  const handleChange = (key: keyof typeof design, value: string) => {
    if (lockedSettings[key]) return; // Sécurité supplémentaire
    setDesign(prev => ({ ...prev, [key]: value }));
  };

  const toggleLock = (key: string) => {
    setLockedSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveToSource = () => {
    fetch("http://localhost:5005/api/fs/write", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: "../../v0-interface-versel", file: "src/design-tokens.json", content: JSON.stringify(design, null, 2) })
    })
    .then(() => alert("✅ Réglages GRAVÉS dans le code source de l'application !"))
    .catch(err => alert("❌ Erreur lors de la sauvegarde : " + err.message));
  };

  const isColor = (val: string) => val.startsWith('#') || val.startsWith('rgba') || val.startsWith('rgb');

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan to-pink-500">TIGER OMNI-ADMIN STUDIO</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full text-green-400 border border-green-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            100% PARAMÈTRES DÉBLOQUÉS (HMR)
          </div>
          <button 
            onClick={saveToSource}
            className="text-xs font-black bg-cyan hover:bg-cyan/80 text-black px-4 py-2 rounded-lg border border-cyan/50 flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(8,179,201,0.4)] hover:scale-105"
          >
            💾 GRAVER DANS LE MARBRE
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: CATEGORIES */}
        <div className="w-80 bg-black/40 border-r border-white/10 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4 pl-2">Zones & Composants</h2>
            <div className="space-y-1">
              {Object.keys(categories).map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeCategory === cat ? 'bg-gradient-to-r from-cyan/20 to-pink-500/10 text-white border-l-4 border-cyan' : 'text-gray-400 hover:bg-white/5 border-l-4 border-transparent'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: DYNAMIC CONTROLS */}
        <div className="flex-1 bg-[#0a0a0a] p-8 overflow-y-auto custom-scrollbar relative">
          
          <div className="max-w-4xl mx-auto pb-32">
            <h2 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan to-pink-500">
              {activeCategory}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {(categories as any)[activeCategory].map((key: string) => {
                const val = (design as any)[key];
                const cssVarName = formatKeyToCSSVar(key);

                // --- SMART AUTO-RENDERER ---
                // 1. Génération du nom ludique avec Emojis
                const getLudicLabel = (k: string) => {
                  const words = k.replace(/([A-Z])/g, ' $1').toLowerCase().split(' ');
                  let emoji = '⚙️';
                  if (words.some(w => ['couleur', 'bg', 'fond'].includes(w))) emoji = '🎨';
                  else if (words.some(w => ['largeur', 'large', 'width'].includes(w))) emoji = '↔️';
                  else if (words.some(w => ['hauteur', 'haut', 'top', 'height'].includes(w))) emoji = '↕️';
                  else if (words.some(w => ['bas', 'bottom'].includes(w))) emoji = '👇';
                  else if (words.some(w => ['gauche', 'left'].includes(w))) emoji = '👈';
                  else if (words.some(w => ['droite', 'right'].includes(w))) emoji = '👉';
                  else if (words.some(w => ['taille', 'size'].includes(w))) emoji = '📏';
                  else if (words.some(w => ['arrondi', 'radius'].includes(w))) emoji = '🔄';
                  else if (words.some(w => ['ombre', 'shadow'].includes(w))) emoji = '☁️';
                  else if (words.some(w => ['bordure', 'border'].includes(w))) emoji = '🔲';
                  else if (words.some(w => ['police', 'font'].includes(w))) emoji = '🔤';
                  else if (words.some(w => ['texte', 'text'].includes(w))) emoji = '📝';
                  else if (words.some(w => ['position'].includes(w))) emoji = '📌';
                  else if (words.some(w => ['flou', 'blur'].includes(w))) emoji = '🌫️';
                  else if (words.some(w => ['padding', 'margin', 'gap'].includes(w))) emoji = '📐';
                  
                  const titleCased = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return `${emoji} ${titleCased}`;
                };

                const ludicLabel = getLudicLabel(key);

                // 2. Détection du type d'input
                const isColorVal = isColor(val);
                const sliderMatch = typeof val === 'string' ? val.match(/^(-?\d+\.?\d*)(px|vw|vh|%|rem|em)$/) : null;
                const isPosition = key.toLowerCase().includes('position');
                const isDisplay = key.toLowerCase().includes('display');
                const isFlexWrap = key.toLowerCase().includes('flexwrap');
                const isJustify = key.toLowerCase().includes('justify');
                const isOverflow = key.toLowerCase().includes('overflow');
                const isLocked = !!lockedSettings[key];

                return (
                  <div key={key} className={`bg-white/5 p-5 rounded-xl border transition-colors shadow-lg flex flex-col justify-between group ${isLocked ? 'border-red-500/30 opacity-75' : 'border-white/10 hover:border-cyan/50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <label className="block text-sm font-black text-white mb-1 drop-shadow-md">{ludicLabel}</label>
                        <code className="text-[10px] text-cyan block mb-1 font-mono opacity-60">var({cssVarName})</code>
                      </div>
                      <button 
                        onClick={() => toggleLock(key)} 
                        className={`p-2 rounded-lg text-lg transition-all ${isLocked ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-black/50 text-gray-500 hover:text-white border border-white/5 hover:border-white/20'}`}
                        title={isLocked ? "Déverrouiller" : "Verrouiller ce réglage"}
                      >
                        {isLocked ? '🔒' : '🔓'}
                      </button>
                    </div>
                    
                    {isPosition ? (
                      <select 
                        value={val} 
                        onChange={(e) => handleChange(key as any, e.target.value)} 
                        disabled={isLocked}
                        className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <option value="relative">Relative</option>
                        <option value="absolute">Absolute</option>
                        <option value="fixed">Fixed</option>
                        <option value="sticky">Sticky</option>
                        <option value="static">Static</option>
                      </select>
                    ) : isDisplay ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <option value="flex">flex</option>
                        <option value="grid">grid</option>
                        <option value="block">block</option>
                        <option value="none">none</option>
                      </select>
                    ) : isFlexWrap ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <option value="nowrap">nowrap</option>
                        <option value="wrap">wrap</option>
                        <option value="wrap-reverse">wrap-reverse</option>
                      </select>
                    ) : isJustify ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <option value="flex-start">flex-start</option>
                        <option value="flex-end">flex-end</option>
                        <option value="center">center</option>
                        <option value="space-between">space-between</option>
                        <option value="space-around">space-around</option>
                        <option value="space-evenly">space-evenly</option>
                      </select>
                    ) : isOverflow ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <option value="visible">visible</option>
                        <option value="hidden">hidden</option>
                        <option value="scroll">scroll</option>
                        <option value="auto">auto</option>
                      </select>
                    ) : isColorVal && val.startsWith('#') ? (
                      <div className={`flex items-center gap-3 bg-black/50 p-2 rounded-lg border border-white/10 ${isLocked ? 'opacity-50' : ''}`}>
                        <input type="color" value={val} disabled={isLocked} onChange={(e) => handleChange(key as any, e.target.value)} className={`w-10 h-10 rounded bg-transparent border-0 shrink-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
                        <input type="text" value={val} disabled={isLocked} onChange={(e) => handleChange(key as any, e.target.value)} className={`w-full bg-transparent border-none text-sm text-white font-mono outline-none ${isLocked ? 'cursor-not-allowed' : ''}`} />
                      </div>
                    ) : sliderMatch ? (
                      <div className={`flex flex-col gap-2 ${isLocked ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center bg-black/50 p-2 rounded-lg border border-white/10">
                          <input 
                            type="range" 
                            min={sliderMatch[2] === '%' ? 0 : -500} 
                            max={sliderMatch[2] === '%' ? 100 : (sliderMatch[2] === 'px' ? 1500 : 200)} 
                            value={sliderMatch[1]} 
                            disabled={isLocked}
                            onChange={(e) => handleChange(key as any, `${e.target.value}${sliderMatch[2]}`)} 
                            className={`w-full accent-cyan ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </div>
                        <div className={`text-right text-xs font-mono px-2 py-1 rounded inline-block self-end border ${isLocked ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-cyan bg-black/30 border-cyan/20'}`}>
                          {val}
                        </div>
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={val} 
                        disabled={isLocked}
                        onChange={(e) => handleChange(key as any, e.target.value)} 
                        className={`w-full bg-black/80 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none transition-colors font-mono ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        placeholder="ex: 12px, rgba(...)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDesignApp;
