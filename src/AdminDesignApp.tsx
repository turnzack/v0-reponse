import React, { useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import defaultDesign from './design-tokens.json';
import { safeFetch } from './lib/bridgeClient';

const designStructure = {
  "🌍 Structure Globale": {
    "Architecture": ['appLargeurMax', 'appHauteurMax'],
    "Fonds & Couleurs": ['appBgTop', 'appBgBottom', 'couleurTextePrincipal', 'couleurTexteSecondaire', 'couleurAccentCyan', 'couleurAccentRose', 'couleurAccentVert', 'couleurAccentViolet', 'flouGlobalArrierePlan'],
    "Typographie": ['fontPrincipale', 'fontTitre', 'fontCode', 'tailleTexteNano', 'tailleTexteMini', 'tailleTexteBase', 'tailleTexteTitre', 'tailleTexteGeant']
  },
  "🏠 Page d'Accueil": {
    "En-tête (Header)": ['headerPosition', 'headerTop', 'headerLeft', 'headerLargeur', 'headerZIndex', 'headerHauteur', 'headerPadding', 'headerBgCouleur', 'headerBordureBas', 'headerOmbre'],
    "Logo": ['logoTaille', 'logoArrondi', 'logoBgCouleur', 'logoOmbre', 'logoEmojiTaille'],
    "Titre & Sous-Titre": ['titrePoids', 'titreCouleur', 'titreEspacement', 'sousTitreCouleur', 'sousTitrePoids'],
    "Icônes Applications": ['iconeReglagesBg', 'iconeAssistantBg', 'iconeProjetsBg', 'iconePacksBg', 'iconeActualitesBg', 'appIconeLargeur', 'appIconeHauteur', 'appIconeArrondi', 'appIconeBordure', 'appIconeOmbre', 'appIconeOmbreSurvol', 'appIconeScaleSurvol', 'appIconeEmojiTaille', 'appIconeTransition', 'appTexteTaille', 'appTexteCouleur', 'appTextePoids', 'appTexteMargeHaut'],
    "Grille d'Applications": ['grillePosition', 'grillePositionX', 'grillePositionY', 'grilleDisplay', 'grilleFlexWrap', 'grilleJustify', 'grilleOverflowX', 'grilleMaxLargeur', 'chatLayoutMaxLargeur', 'grilleMargeHaut', 'grilleMargeBas', 'grilleGapX', 'grilleGapY'],
    "📦 Conteneur Carrousel Principal": [
      'chatLayoutLargeur',
      'chatLayoutHauteur',
      'chatLayoutMaxLargeur',
      'chatLayoutPosition',
      'chatLayoutPositionX',
      'chatLayoutPositionY',
      'carteCarrouselConteneurHauteur',
      'carteCarrouselConteneurLargeur',
      'carteCarrouselConteneurGap',
      'carteCarrouselConteneurPosition',
      'carteCarrouselConteneurPositionX',
      'carteCarrouselConteneurPositionY'
    ],
    "Cartes & Carrousel": [
      'carteCarrouselHauteur',
      'carteCarrouselLargeur',
      'carteCarrouselPosition',
      'carteCarrouselPositionX',
      'carteCarrouselPositionY',
      'carteCarrouselPadding',
      'carteCarrouselGap',
      'carteCarrouselArrondi',
      'carteCarrouselBordure',
      'carteCarrouselBg',
      'carteCarrouselOmbre',
      'carteCarrouselScaleSurvol',
      'carteCarrouselTransition',
      'carteCarrouselTitreTaille',
      'carteCarrouselTitreCouleur',
      'carteCarrouselTexteTaille',
      'carteCarrouselTexteCouleur',
      'carteCarrouselTitreTailleSurvol',
      'carteCarrouselTexteTailleSurvol'
    ],
    "Packs PRD Carrousel": [
      'carteGuestPosition',
      'carteGuestPositionX',
      'carteGuestPositionY',
      'carteGuestLargeur',
      'carteGuestMargeDroite',
      'carteGuestZIndex',
      'prdTitreSectionTaillePolice',
      'prdTitreSectionCouleur',
      'prdTitreSectionPosition',
      'prdTitreSectionPositionX',
      'prdTitreSectionPositionY',
      'prdTitreSectionMargeBas',
      'prdBadgeTaillePolice',
      'prdBadgeCouleur',
      'prdBadgeBg',
      'prdCarteBoutonTaillePolice',
      'prdCarteBoutonBg',
      'prdCarteBoutonCouleur',
      'prdBoutonPadding',
      'prdBoutonArrondi',
      'prdBoutonPosition',
      'prdBoutonPositionX',
      'prdBoutonPositionY'
    ],
    "Fenêtre Readme & Documentation": [
      'fenetreReadmePosition',
      'fenetreReadmePositionX',
      'fenetreReadmePositionY',
      'fenetreReadmeLargeurMax',
      'fenetreReadmeHauteurMax',
      'fenetreReadmeTaillePolice'
    ],
    "⚙️ Fenêtre Configuration": [
      'configModalTaillePolice',
      'configModalTitreTaille'
    ]
  },
  "💬 Chat & Footer": {
    "Conteneur Principal": ['chatMainPosition', 'chatMainTop', 'chatMainBottom', 'chatMainRight', 'chatMainWidth', 'chatConteneurBg', 'chatConteneurFlou', 'chatConteneurBordureHaut', 'chatConteneurPaddingHaut', 'chatConteneurPaddingBas', 'chatConteneurPaddingX'],
    "Mise en Page": ['chatLayoutGap', 'chatLayoutMaxLargeur', 'chatLayoutLargeur', 'chatLayoutHauteur', 'chatLayoutPosition', 'chatLayoutPositionX', 'chatLayoutPositionY', 'chatBullesEspacement', 'chatBullesPosition', 'chatBullesPositionX', 'chatBullesPositionY', 'chatBullePosition', 'chatBullePositionX', 'chatBullePositionY', 'chatBulleTaillePolice', 'chatBullePadding', 'chatBulleArrondi', 'chatSeparateurMargeY'],
    "Message d'Accueil (Système)": [
      'msgAccueilPosition',
      'msgAccueilPositionX',
      'msgAccueilPositionY',
      'msgAccueilTaillePolice',
      'msgAccueilCouleur',
      'msgAccueilBg',
      'msgAccueilPadding',
      'msgAccueilArrondi',
      'msgAccueilLargeurMax'
    ],
    "Statut (Badge)": ['statutPadding', 'statutBg', 'statutBordureBas', 'statutGap', 'statutTexteTaille', 'statutTextePoids', 'statutTexteEspacement', 'statutPastilleTaille'],
    "Barre de Saisie": ['inputHauteur', 'inputLargeur', 'inputBgCouleur', 'inputBordureCouleur', 'inputTexteTaille', 'inputTexteCouleur', 'inputPlaceholderCouleur', 'inputArrondi', 'inputPaddingGauche', 'inputPaddingDroite', 'inputOmbreInterne'],
    "Boutons d'Action": ['btnEnvoiPosition', 'btnEnvoiTop', 'btnEnvoiBottom', 'btnEnvoiLeft', 'btnEnvoiRight', 'btnEnvoiTaille', 'btnEnvoiBg', 'btnEnvoiCouleur', 'btnEnvoiArrondi', 'btnEnvoiIconeTaille', 'trombonePosition', 'tromboneTop', 'tromboneBottom', 'tromboneLeft', 'tromboneRight', 'tromboneTaille', 'tromboneCouleur', 'tromboneMargin', 'newV0Position', 'newV0Top', 'newV0Bottom', 'newV0Left', 'newV0Right', 'newV0Padding', 'newV0Taille', 'newV0Bg', 'newV0Couleur', 'newV0Arrondi', 'newV0Bordure', 'newV0Margin'],
    "Pied de Page": ['footerPosition', 'footerBas', 'footerGauche', 'footerLargeur', 'footerZIndex']
  },
  "💻 Espace IDE": {
    "Barre d'Outils": ['ideToolbarHauteur', 'ideToolbarBg', 'ideToolbarBordure', 'ideBtnActionTaille', 'ideBtnActionArrondi', 'ideBtnActionBg', 'ideBtnActionBordure', 'ideBtnActionEmoji'],
    "Explorateur (Fichiers)": ['explorateurLargeur', 'explorateurBg', 'explorateurBordureDroite', 'explorateurTexteTaille', 'explorateurDossierCouleur', 'explorateurFichierCouleur'],
    "Éditeur de Code": ['editeurBg', 'editeurOngletHauteur', 'editeurOngletBg', 'editeurOngletBordure'],
    "Live Preview": ['previewBg', 'previewLargeur', 'previewBordureGauche'],
    "Panneau Droit (Mouchard)": ['sidebarDroitePosition', 'sidebarDroiteTop', 'sidebarDroiteBas', 'sidebarDroiteLargeur', 'mouchardBg', 'mouchardBordureGauche', 'mouchardOmbre', 'mouchardEnteteBg', 'mouchardEnteteHauteur', 'mouchardTitreCouleur', 'mouchardTexteTaille', 'mouchardTexteCouleurDefaut', 'mouchardTexteCouleurErreur']
  },
  "🪟 Modales & Popups": {
    "Fond & Arrière-Plan": ['modalFondAssombrissement', 'modalFondFlou', 'modalLargeurMax', 'modalHauteurMax', 'modalBgTop', 'modalBgBottom', 'modalBordure', 'modalArrondi', 'modalOmbre'],
    "Contenu (PRD)": ['modalPrdBg', 'modalPrdBordure', 'modalPrdEnteteBg', 'modalPrdTitreCouleur'],
    "Sidebar Modale": ['modalSidebarLargeur', 'modalSidebarBg', 'modalOngletPadding', 'modalOngletArrondi', 'modalOngletGap', 'modalOngletBgActif', 'modalOngletBordureActif', 'modalOngletCouleurActif', 'modalOngletCouleurInactif']
  }
};

const ElementSettingCard = ({ element, onSave, onSetLayer }: any) => {
  const [text, setText] = useState(element.text);
  
  // Custom Visual Controls State
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // RAW State (for advanced mode & underlying code)
  const [rawSize, setRawSize] = useState(element.size);
  const [rawColor, setRawColor] = useState(element.color);
  const [rawLayout, setRawLayout] = useState(element.layout);

  // Sync state if element changes externally
  useEffect(() => {
    setText(element.text);
    setRawSize(element.size);
    setRawColor(element.color);
    setRawLayout(element.layout);
    
    // Attempt to parse visual values
    const colorMatch = element.color.match(/text-\[#([0-9a-fA-F]{6})\]/);
    if (colorMatch) setFontColor(`#${colorMatch[1]}`);
    else setFontColor("#ffffff"); // fallback
    
    const sizeMatch = element.size.match(/text-\[([0-9]+)px\]/);
    if (sizeMatch) setFontSize(parseInt(sizeMatch[1]));
    else setFontSize(16); // fallback
    
    const mlMatch = element.layout.match(/ml-\[(-?[0-9]+)px\]/);
    if (mlMatch) setPosX(parseInt(mlMatch[1]));
    else setPosX(0); // fallback

    const mtMatch = element.layout.match(/mt-\[(-?[0-9]+)px\]/);
    if (mtMatch) setPosY(parseInt(mtMatch[1]));
    else setPosY(0);
  }, [element]);

  // When visual controls change, we update the RAW strings automatically
  const handleVisualSave = (type: string, value: any) => {
    let newRawSize = rawSize;
    let newRawColor = rawColor;
    let newRawLayout = rawLayout;

    if (type === 'fontSize') {
      setFontSize(value);
      if (element.originalText === null) {
        // C'est un bloc structurel, changer la taille cible le padding ou la taille brute, mais restons simple
        newRawSize = newRawSize.replace(/\bp-\S+/g, '').trim();
        newRawSize += ` p-[${value}px]`;
      } else {
        newRawSize = newRawSize.replace(/\btext-\S+/g, '').trim();
        newRawSize += ` text-[${value}px]`;
      }
    }
    if (type === 'fontColor') {
      setFontColor(value);
      if (element.originalText === null) {
        // C'est un bloc structurel, on cible la couleur de fond
        newRawColor = newRawColor.replace(/\bbg-\S+/g, '').trim();
        newRawColor += ` bg-[${value}]`;
      } else {
        newRawColor = newRawColor.replace(/\btext-\S+/g, '').trim();
        newRawColor += ` text-[${value}]`;
      }
    }
    if (type === 'posX') {
      setPosX(value);
      newRawLayout = newRawLayout.replace(/\b-?ml-\S+/g, '').trim();
      newRawLayout += ` ml-[${value}px]`;
    }
    if (type === 'posY') {
      setPosY(value);
      newRawLayout = newRawLayout.replace(/\b-?mt-\S+/g, '').trim();
      newRawLayout += ` mt-[${value}px]`;
    }

    setRawSize(newRawSize.trim());
    setRawColor(newRawColor.trim());
    setRawLayout(newRawLayout.trim());

    onSave(element, { text, size: newRawSize.trim(), color: newRawColor.trim(), layout: newRawLayout.trim() });
  };

  const handleRawSave = (field: string, val: string) => {
    if (field === 'text') setText(val);
    if (field === 'size') setRawSize(val);
    if (field === 'color') setRawColor(val);
    if (field === 'layout') setRawLayout(val);
    
    onSave(element, {
      text: field === 'text' ? val : text,
      size: field === 'size' ? val : rawSize,
      color: field === 'color' ? val : rawColor,
      layout: field === 'layout' ? val : rawLayout,
    });
  };

  const handleLayerClick = (plan: 'top' | 'up' | 'down' | 'bottom') => {
    if (onSetLayer) {
      onSetLayer(plan);
      return;
    }
    let l = rawLayout.replace(/z-\S+/g, '').replace(/\s+/g, ' ').trim();
    if (!l.includes('relative') && !l.includes('absolute') && !l.includes('fixed') && !l.includes('sticky')) {
      l = `relative ${l}`;
    }
    const zClass = plan === 'top' ? 'z-[9999]' : plan === 'up' ? 'z-[100]' : plan === 'down' ? 'z-[10]' : 'z-[1]';
    l = `${l} ${zClass}`.trim();
    handleRawSave('layout', l);
  };

  return (
    <div className="flex flex-col gap-4 bg-black/60 p-5 rounded-xl border border-white/10 hover:border-cyan/30 transition-colors shadow-inner col-span-full">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧩</span>
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">Élément : {element.tag}</h3>
        </div>
        <button onClick={() => setAdvancedMode(!advancedMode)} className="text-[10px] text-gray-500 hover:text-cyan uppercase font-bold transition-colors">
          {advancedMode ? 'Basculer en Vue Simplifiée (Sliders)' : 'Basculer en Vue Avancée (Classes)'}
        </button>
      </div>
      {element.originalText !== null && (
        <div className="flex flex-col gap-2 w-full">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">📝 Texte de l'élément</label>
          <input type="text" value={text} onChange={(e) => handleRawSave('text', e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-cyan outline-none font-mono" />
        </div>
      )}

      {!advancedMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 p-4 bg-white/5 rounded-lg border border-white/5">
          {/* Couleur */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">🎨 Couleur {element.originalText === null ? '(Fond/Bordure)' : 'du Texte'}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={fontColor} onChange={(e) => handleVisualSave('fontColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
              <span className="text-xs font-mono text-gray-400">{fontColor}</span>
            </div>
          </div>

          {/* Taille */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span>📏 {element.originalText === null ? 'Dimension Globale' : 'Taille de Police'}</span>
              <span className="text-cyan font-mono">{fontSize}px</span>
            </label>
            <input type="range" min="8" max="120" value={fontSize} onChange={(e) => handleVisualSave('fontSize', Number(e.target.value))} className="w-full accent-cyan" />
          </div>

          {/* Positionnement */}
          <div className="flex flex-col gap-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">📐 Déplacement (X / Y)</label>
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-xs text-gray-500">
                 <span>↔️ X</span>
                 <input type="range" min="-1000" max="1000" value={posX} onChange={(e) => handleVisualSave('posX', Number(e.target.value))} className="flex-1 accent-pink-500" />
                 <span className="w-10 text-right font-mono">{posX}</span>
               </div>
               <div className="flex items-center gap-2 text-xs text-gray-500">
                 <span>↕️ Y</span>
                 <input type="range" min="-1000" max="1000" value={posY} onChange={(e) => handleVisualSave('posY', Number(e.target.value))} className="flex-1 accent-pink-500" />
                 <span className="w-10 text-right font-mono">{posY}</span>
               </div>
             </div>
          </div>

          {/* Calques (Z-Index / Ordre d'affichage) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">📚 Calque (Ordre d'Affichage)</label>
             <div className="grid grid-cols-4 gap-1.5">
               <button onClick={() => handleLayerClick('top')} className="py-1.5 px-2 bg-white/5 hover:bg-cyan/20 hover:text-cyan border border-white/10 rounded text-[10px] font-bold transition-all text-center" title="Mettre au 1er plan (Devant tout)">🔝 1er Plan</button>
               <button onClick={() => handleLayerClick('up')} className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold transition-all text-center">⬆️ Monter</button>
               <button onClick={() => handleLayerClick('down')} className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold transition-all text-center">⬇️ Descendre</button>
               <button onClick={() => handleLayerClick('bottom')} className="py-1.5 px-2 bg-white/5 hover:bg-pink-500/20 hover:text-pink-400 border border-white/10 rounded text-[10px] font-bold transition-all text-center" title="Mettre au 2nd plan (Derrière tout)">🔻 2nd Plan</button>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 border-t border-white/5 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">🎨 Classes Couleur</label>
            <input type="text" value={rawColor} onChange={(e) => handleRawSave('color', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-cyan focus:border-cyan outline-none font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">📏 Classes Taille</label>
            <input type="text" value={rawSize} onChange={(e) => handleRawSave('size', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-pink-400 focus:border-cyan outline-none font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">📐 Classes Position</label>
            <input type="text" value={rawLayout} onChange={(e) => handleRawSave('layout', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-gray-400 focus:border-cyan outline-none font-mono" />
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDesignApp = () => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(designStructure)[0]);
  const [activeSubCategory, setActiveSubCategory] = useState(Object.keys(designStructure[Object.keys(designStructure)[0] as keyof typeof designStructure])[0]);
  const [design, setDesign] = useState(defaultDesign);
  const [lockedSettings, setLockedSettings] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const [dynamicStructure, setDynamicStructure] = useState<any>(null);

  const [activePagePath, setActivePagePath] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<string>("");
  const [pageFilter, setPageFilter] = useState<string>("all"); // 'all' | 'text' | 'blocks'
  const [clickedElementData, setClickedElementData] = useState<any>(null);
  const [draggedElementData, setDraggedElementData] = useState<any>(null);
  const [resizedElementData, setResizedElementData] = useState<any>(null);
  const [collidedElementData, setCollidedElementData] = useState<any>(null);

  // Mode Design (Actif / Inactif) et Persistence
  const [isDesignMode, setIsDesignMode] = useState<boolean>(() => {
    return localStorage.getItem('sovereign_is_design_mode') === 'true';
  });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSavedButton, setIsSavedButton] = useState<boolean>(false);

  // Strict UI Update State
  const [showUiUpdateModal, setShowUiUpdateModal] = useState<boolean>(false);
  const [isUiUpdateLoading, setIsUiUpdateLoading] = useState<boolean>(false);
  const [newV0Html, setNewV0Html] = useState<string>("");

  // Thèmes et DESIGN.md Modal State
  const DEFAULT_PRESETS = [
    {
      id: 'ethereal-obsidian',
      name: '💎 Ethereal Obsidian (DESIGN.md)',
      path: 'e:\\v0reponses\\themes\\ethereal-obsidian.css',
      type: 'md',
      colors: { primary: '#8b5cf6', secondary: '#3b82f6', tertiary: '#06b6d4', neutral: '#131315' },
      content: `/* 💎 Thème Ethereal Obsidian (DESIGN.md) */
:root {
  --background: #131315;
  --surface: #131315;
  --surface-container: #201f22;
  --surface-container-high: #2a2a2c;
  --foreground: #e5e1e4;
  --primary: #8b5cf6;
  --on-primary: #ffffff;
  --secondary: #3b82f6;
  --tertiary: #06b6d4;
  --neutral: #09090b;
  --border: rgba(255, 255, 255, 0.1);
  --radius: 0.75rem;
}`
    },
    {
      id: 'cyberpunk-neon',
      name: '⚡ Cyberpunk Neon',
      path: 'e:\\v0reponses\\themes\\cyberpunk-neon.css',
      type: 'css',
      colors: { primary: '#00f0ff', secondary: '#ff0055', tertiary: '#ffe600', neutral: '#090a0f' },
      content: `/* ⚡ Thème Cyberpunk Neon */
:root {
  --background: #090a0f;
  --surface: #0d0e15;
  --foreground: #f0f4fc;
  --primary: #00f0ff;
  --secondary: #ff0055;
  --tertiary: #ffe600;
  --neutral: #050608;
  --border: rgba(0, 240, 255, 0.2);
  --radius: 0.5rem;
}`
    }
  ];

  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [availableThemes, setAvailableThemes] = useState<any[]>(DEFAULT_PRESETS);
  const [themeApplyMessage, setThemeApplyMessage] = useState<string | null>(null);
  
  // Portée du Thème (Global vs Page Spécifique)
  const [themeScope, setThemeScope] = useState<'global' | 'page'>('global');
  const [selectedPageScope, setSelectedPageScope] = useState<string>('Cockpit');

  // Floating Drawer & Paint Bucket Tool State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'select' | 'bucket' | 'pipette' | 'theme'>('select');
  const [activeColor, setActiveColor] = useState<string>('#8b5cf6');
  const [activeRadius, setActiveRadius] = useState<string>('0.75rem');
  const [drawerTab, setDrawerTab] = useState<'theme' | 'md'>('theme');
  const [activeThemeName, setActiveThemeName] = useState<string>('Ethereal Obsidian');

  // Pot de peinture : Applique la couleur active aux éléments sélectionnés
  const handleApplyPaintBucket = () => {
    if (!clickedElementData) {
      setThemeApplyMessage("⚠️ Sélectionnez d'abord 1 ou plusieurs éléments (Ctrl + Clic)");
      setTimeout(() => setThemeApplyMessage(null), 3000);
      return;
    }

    const elementsToUpdate = Array.isArray(clickedElementData) ? clickedElementData : [clickedElementData];
    elementsToUpdate.forEach(el => {
      handleSavePageSetting(el, {
        size: el.size || "",
        color: `bg-[${activeColor}] text-white`,
        layout: el.layout || "",
        text: el.text
      });
    });

    setThemeApplyMessage(`🪣 Pot de peinture appliqué (${activeColor}) sur ${elementsToUpdate.length} élément(s) !`);
    setTimeout(() => setThemeApplyMessage(null), 3000);
  };

  // Pipette (EyeDropper)
  const handleActivatePipette = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          setActiveColor(result.sRGBHex);
          setThemeApplyMessage(`💧 Couleur prélevée avec succès : ${result.sRGBHex}`);
          setTimeout(() => setThemeApplyMessage(null), 3000);
        }
      } catch (e) { }
    } else {
      setThemeApplyMessage("💧 Pipette : Cliquez sur n'importe quel échantillon du nuancier pour prélever la couleur");
      setTimeout(() => setThemeApplyMessage(null), 3000);
    }
  };


  const fetchThemes = () => {
    safeFetch('http://localhost:5006/api/themes')
      .then(res => res ? res.json() : null)
      .then(data => {
        if (data && data.success && Array.isArray(data.themes) && data.themes.length > 0) {
          const merged = [...DEFAULT_PRESETS];
          data.themes.forEach((t: any) => {
            if (!merged.some(m => m.id === t.id)) {
              merged.push({
                ...t,
                colors: { primary: '#8b5cf6', secondary: '#3b82f6', tertiary: '#06b6d4', neutral: '#131315' }
              });
            }
          });
          setAvailableThemes(merged);
        }
      })
      .catch(() => {});
  };

  const handleApplyTheme = async (theme: any) => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project') || 'Obsidian Flux';
    
    try {
      const res = await safeFetch('http://localhost:5006/api/themes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project: targetProject, 
          themeFile: theme.path, 
          cssContent: theme.content,
          scope: themeScope,
          targetPage: selectedPageScope
        })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          const scopeLabel = themeScope === 'page' ? `Page ${selectedPageScope}` : 'Tout le Projet';
          setThemeApplyMessage(`✓ Thème "${theme.name}" appliqué sur ${targetProject} (${scopeLabel}) !`);
          setTimeout(() => setThemeApplyMessage(null), 3500);
          setShowThemeModal(false);
          return;
        }
      }
    } catch (e) { }

    // Fallback de secours direct en écriture fs
    safeFetch('http://localhost:5006/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: targetProject, file: 'src/app/globals.css', content: theme.content })
    }).catch(() => {});
    setThemeApplyMessage(`✓ Thème "${theme.name}" appliqué sur ${targetProject} (globals.css) !`);
    setTimeout(() => setThemeApplyMessage(null), 3500);
    setShowThemeModal(false);
  };




  // Notifier le serveur local du changement de mode et de page active → la preview le poll
  const sendDesignMode = (enabled: boolean) => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project');
    safeFetch('http://localhost:5006/api/design-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, project: targetProject, file: activePagePath })
    }).catch(() => {});
    // Fallback postMessage pour les éventuelles iframes dans la même fenêtre
    document.querySelectorAll('iframe').forEach((fr: HTMLIFrameElement) => {
      try { fr.contentWindow?.postMessage({ type: 'SET_DESIGN_MODE', enabled }, '*'); } catch(_) {}
    });
  };

  // Persistance et diffusion à chaque changement de mode ou de page
  useEffect(() => {
    localStorage.setItem('sovereign_is_design_mode', String(isDesignMode));
    if (!isDesignMode) setClickedElementData(null);
    sendDesignMode(isDesignMode);
  }, [isDesignMode, activePagePath]);

  // Bascule Mode Design / App Live
  const toggleDesignMode = () => setIsDesignMode(prev => !prev);

  const handleManualSave = () => {
    if (pageContent && activePagePath) {
      handleSavePage(pageContent, true);
      setIsSavedButton(true);
      setSaveSuccessMessage("✓ Projet Sauvegardé avec Succès ! Fichiers TSX à jour sur disque.");
      setTimeout(() => {
        setSaveSuccessMessage(null);
        setIsSavedButton(false);
      }, 1800);
    }
  };

  const handleStrictUiUpdate = async () => {
    if (!newV0Html.trim() || !activePagePath) return;
    
    setIsUiUpdateLoading(true);
    setSaveSuccessMessage("🚀 Proposition UI envoyée... (Mise en file d'attente)");

    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project') || "PASS";

    try {
      const payload = {
        projectId: targetProject,
        targetFile: activePagePath,
        zipFileName: newV0Html.trim(), // On envoie le nom du zip
        baseVersionId: "v1-current", // Simulé pour le vertical slice
        mode: "strict-ui",
        targetRoute: "/", // Route par défaut
        source: "vercel-interface",
        promotionMode: "disabled",
        idempotencyKey: `push-${targetProject}-${Date.now()}`
      };

      const res = await safeFetch("http://localhost:5006/api/bridge/strict-ui-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res || !res.ok) throw new Error("Mode Cloud SaaS actif - Bridge Electron distant");
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Erreur lors de la requête");
      }

      setSaveSuccessMessage(`⏳ Push ${data.pushId} en cours d'analyse...`);
      setShowUiUpdateModal(false);

      // Polling de l'état
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await safeFetch(`http://localhost:5006/api/bridge/strict-ui-update/${data.pushId}?projectId=${targetProject}`);
          if (statusRes && statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.success) {
              setSaveSuccessMessage(`⏳ État: ${statusData.state} ...`);
              if (statusData.state === "preview_ready") {
                clearInterval(pollInterval);
                setIsUiUpdateLoading(false);
                setNewV0Html("");
                setSaveSuccessMessage(`✅ Preview prête !`);
                setTimeout(() => setSaveSuccessMessage(null), 5000);
              } else if (statusData.state === "failed" || statusData.state === "rejected") {
                clearInterval(pollInterval);
                setIsUiUpdateLoading(false);
                setSaveSuccessMessage(`❌ Échec du Push: ${statusData.error || "Raison inconnue"}`);
              }
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);

    } catch (e: any) {
      setIsUiUpdateLoading(false);
      setSaveSuccessMessage(`❌ Erreur réseau: ${e.message}`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    }
  };

  // Auto-Save de Secours dans localStorage
  useEffect(() => {
    if (pageContent && activePagePath) {
      localStorage.setItem(`sovereign_backup_${activePagePath}`, pageContent);
    }
  }, [pageContent, activePagePath]);

  // Save de Secours automatique à la fermeture ou crash du navigateur (beforeunload / pagehide)
  useEffect(() => {
    const handleUnload = () => {
      if (pageContent && activePagePath) {
        handleSavePage(pageContent, false);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [pageContent, activePagePath]);



  // Historique Undo / Redo (8 snapshots max)
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const pushHistoryState = (newContent: string) => {
    setHistoryStack(prev => {
      const currentHistory = prev.slice(0, historyIndex + 1);
      const updated = [...currentHistory, newContent];
      if (updated.length > 8) {
        updated.shift();
      }
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const prevContent = historyStack[newIdx];
      setPageContent(prevContent);
      handleSavePage(prevContent, false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const nextContent = historyStack[newIdx];
      setPageContent(nextContent);
      handleSavePage(nextContent, false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DESIGN_ELEMENT_CLICKED') {
         setClickedElementData(event.data.payload);
         setPageFilter('all');
      }
      if (event.data?.type === 'DESIGN_ELEMENT_DRAGGED') {
         setDraggedElementData(event.data.payload);
      }
      if (event.data?.type === 'DESIGN_ELEMENT_RESIZED') {
         setResizedElementData(event.data.payload);
      }
      if (event.data?.type === 'DESIGN_ELEMENT_COLLIDED') {
         setCollidedElementData(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const struct = dynamicStructure || designStructure;
    if (activeCategory.startsWith("📁") && struct[activeCategory]?.[activeSubCategory]) {
      const path = struct[activeCategory][activeSubCategory][0];
      if (path && path !== activePagePath) {
        setActivePagePath(path);
      }
    }
  }, [activeCategory, activeSubCategory, dynamicStructure, designStructure]);

  useEffect(() => {
    if (activePagePath) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetProject = urlParams.get('project');
      safeFetch(`http://localhost:5006/api/fs/read?project=${targetProject}&file=${encodeURIComponent(activePagePath)}`)
        .then(res => res ? res.json() : null)
        .then(data => {
           if (data && data.success) {
             setPageContent(data.content);
             setHistoryStack([data.content]);
             setHistoryIndex(0);
           }
        });
    }
  }, [activePagePath]);

  const handleSavePage = (content: string, recordHistory = true) => {
    setPageContent(content);
    if (recordHistory) {
      pushHistoryState(content);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project');
    safeFetch("http://localhost:5006/api/fs/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: targetProject, file: activePagePath, content })
    }).catch(() => {});
  };

  const parsedPageSettings = useMemo(() => {
    if (!activeCategory || !activeCategory.startsWith("📁") || !pageContent) return [];
    
    const elements: any[] = [];
    
    // On cherche <tag className="...">Texte</tag>
    const elementRegex = /<([a-zA-Z0-9]+)([^>]*)>\s*([^<{}]+?)\s*<\/\1>/g;
    let match;
    while ((match = elementRegex.exec(pageContent)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      const text = match[3].trim();
      
      if (text.length > 1 && !text.startsWith('/*') && !text.startsWith('//') && /[a-zA-Z]/.test(text)) {
        
        let className = "";
        let originalClassMatch = "";
        const classMatch = attrs.match(/className=(['"])(.*?)\1/);
        if (classMatch) {
          originalClassMatch = classMatch[0];
          className = classMatch[2];
        }

        // Split className heuristically
        const classes = className.split(' ').filter((c: string) => c.trim() !== '');
        
        const sizeClasses: string[] = [];
        const colorClasses: string[] = [];
        const layoutClasses: string[] = [];
        
        classes.forEach((c: string) => {
          if (c.startsWith('text-') && (c.includes('sm') || c.includes('md') || c.includes('lg') || c.includes('xl') || c.includes('['))) {
            if (c.includes('primary') || c.includes('error') || c.includes('surface') || c.includes('#')) {
              colorClasses.push(c);
            } else {
              sizeClasses.push(c);
            }
          } else if (c.startsWith('font-') || c.startsWith('leading-') || c.startsWith('tracking-') || c.startsWith('w-') || c.startsWith('h-')) {
            if (c.startsWith('w-') || c.startsWith('h-')) layoutClasses.push(c);
            else sizeClasses.push(c);
          } else if (c.startsWith('bg-') || c.startsWith('border-') || c.startsWith('text-')) {
            colorClasses.push(c);
          } else {
            layoutClasses.push(c);
          }
        });

        elements.push({
          id: `el_${match.index}`,
          tag: tag,
          originalMatch: match[0],
          originalText: match[3],
          originalClassMatch: originalClassMatch,
          
          text: text,
          size: sizeClasses.join(' '),
          color: colorClasses.join(' '),
          layout: layoutClasses.join(' '),
          
          matchIndex: match.index
        });
      }
    }

    // 2. Extraire les blocs structurels (Cards, Containers) sans capturer le texte intérieur
    const blockRegex = /<(div|section|article|aside|nav)[^>]*?className=(['"])(.*?)\2[^>]*?>/g;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(pageContent)) !== null) {
      const fullTag = blockMatch[0];
      const tag = blockMatch[1];
      const classNameMatch = blockMatch[3];
      
      // On cible uniquement les balises qui agissent comme des "Cards" ou "Blocs" (fond, bordure, ombre)
      if (classNameMatch && (classNameMatch.includes('bg-') || classNameMatch.includes('border') || classNameMatch.includes('shadow-'))) {
        
        const classes = classNameMatch.split(' ').filter((c: string) => c.trim() !== '');
        
        const sizeClasses: string[] = [];
        const colorClasses: string[] = [];
        const layoutClasses: string[] = [];
        
        classes.forEach((c: string) => {
           if (c.startsWith('bg-') || c.startsWith('border-') || c.startsWith('shadow-') || c.startsWith('text-')) {
             colorClasses.push(c);
           } else if (c.startsWith('w-') || c.startsWith('h-') || c.startsWith('min-') || c.startsWith('max-') || c.startsWith('rounded-')) {
             sizeClasses.push(c);
           } else {
             layoutClasses.push(c);
           }
        });

        // originalClassMatch exact extraction
        const classMatch = fullTag.match(/className=(['"])(.*?)\1/);
        
        // Créer un petit aperçu pour aider l'utilisateur à identifier le bloc (ex: les fonds de page)
        let blockPreview = "";
        if (classNameMatch.includes('bg-[')) {
          const bgMatch = classNameMatch.match(/bg-\[[^\]]+\]/);
          if (bgMatch) blockPreview = ` (${bgMatch[0]})`;
        } else if (classNameMatch.includes('bg-')) {
          const bgMatch = classNameMatch.match(/bg-[a-zA-Z0-9-/]+/);
          if (bgMatch) blockPreview = ` (${bgMatch[0]})`;
        }
        
        elements.push({
          id: `block_${blockMatch.index}`,
          tag: `BLOC ${tag.toUpperCase()}${blockPreview}`, // Différenciation UI
          originalMatch: fullTag,
          originalText: null, // Pas de texte associé
          originalClassMatch: classMatch ? classMatch[0] : "",
          
          text: "",
          size: sizeClasses.join(' '),
          color: colorClasses.join(' '),
          layout: layoutClasses.join(' '),
          
          matchIndex: blockMatch.index
        });
      }
    }
    
    // Sort

    elements.sort((a, b) => a.matchIndex - b.matchIndex);
    return elements;
  }, [pageContent, activeCategory]);

  const handleSavePageSetting = (element: any, newVals: any) => {
    let newContent = pageContent;
    
    // 1. Reconstruire la className
    const newClasses = [newVals.size, newVals.color, newVals.layout].filter(Boolean).join(' ');
    let newAttrs = element.originalClassMatch;
    
    if (newClasses !== "") {
      if (element.originalClassMatch) {
        // preserve quote type
        const quote = element.originalClassMatch.match(/['"]/)[0];
        newAttrs = `className=${quote}${newClasses}${quote}`;
      } else {
        newAttrs = ` className="${newClasses}"`;
      }
    } else {
      if (element.originalClassMatch) {
        newAttrs = ""; // remove className
      }
    }

    let newHTML = element.originalMatch;
    
    if (element.originalClassMatch) {
      newHTML = newHTML.replace(element.originalClassMatch, newAttrs);
    } else if (newAttrs !== "") {
      // Insert className after tag (récupérer le vrai nom de balise si préfixé)
      const realTag = element.tag.replace('BLOC ', '').toLowerCase();
      newHTML = newHTML.replace(`<${realTag}`, `<${realTag}${newAttrs}`);
    }
    
    // Replace text (only the extracted group to preserve newlines/spaces)
    if (element.originalText !== null) {
      newHTML = newHTML.replace(element.originalText, newVals.text);
    }

    newContent = newContent.replace(element.originalMatch, newHTML);
    
    setPageContent(newContent);
    if ((window as any).pageSaveTimer) clearTimeout((window as any).pageSaveTimer);
    (window as any).pageSaveTimer = setTimeout(() => handleSavePage(newContent), 500);
  };

  // Traitement du Glisser-Déposer (Drag & Drop)
  useEffect(() => {
    if (draggedElementData && parsedPageSettings.length > 0) {
      const payloadList = Array.isArray(draggedElementData) ? draggedElementData : [draggedElementData];
      let updatedContent = pageContent;

      payloadList.forEach((item: any) => {
        const element = parsedPageSettings.find((el: any) => {
          if (item.text && el.originalText) {
             return el.originalText === item.text || el.text === item.text;
          } else if (item.className && el.originalClassMatch) {
             const firstClass = item.className.split(' ').filter(Boolean)[0];
             if (firstClass && el.originalClassMatch.includes(firstClass)) return true;
          }
          return false;
        });

        if (element) {
          let currentLayout = element.layout || "";
          
          // 1. Extraire les marges existantes du code TSX
          const mlMatch = currentLayout.match(/ml-\[(-?\d+)px\]/);
          const currentMl = mlMatch ? parseInt(mlMatch[1]) : 0;

          const mtMatch = currentLayout.match(/mt-\[(-?\d+)px\]/);
          const currentMt = mtMatch ? parseInt(mtMatch[1]) : 0;

          // 2. Cumul Absolu : Nouvelle Marge = Marge existante + Déplacement réél dx/dy
          const newMl = currentMl + (item.dx || 0);
          const newMt = currentMt + (item.dy || 0);

          // 3. Nettoyage des anciennes classes de position
          currentLayout = currentLayout
            .replace(/mt-\[-?\d+px\]/g, '')
            .replace(/ml-\[-?\d+px\]/g, '')
            .replace(/translate-x-\[-?\d+px\]/g, '')
            .replace(/translate-y-\[-?\d+px\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (newMl !== 0) currentLayout += ` ml-[${newMl}px]`;
          if (newMt !== 0) currentLayout += ` mt-[${newMt}px]`;
          currentLayout = currentLayout.trim();

          const newClasses = [element.size, element.color, currentLayout].filter(Boolean).join(' ');
          let newAttrs = element.originalClassMatch;
          
          if (newClasses !== "") {
            if (element.originalClassMatch) {
              const quote = element.originalClassMatch.match(/['"]/)?.[0] || '"';
              newAttrs = `className=${quote}${newClasses}${quote}`;
            } else {
              newAttrs = ` className="${newClasses}"`;
            }
          } else {
            newAttrs = "";
          }

          let newHTML = element.originalMatch;
          if (element.originalClassMatch) {
            newHTML = newHTML.replace(element.originalClassMatch, newAttrs);
          } else if (newAttrs !== "") {
            const realTag = element.tag.replace('BLOC ', '').toLowerCase();
            newHTML = newHTML.replace(`<${realTag}`, `<${realTag}${newAttrs}`);
          }
          if (element.originalText !== null) {
            newHTML = newHTML.replace(element.originalText, element.text);
          }
          updatedContent = updatedContent.replace(element.originalMatch, newHTML);
        }
      });

      handleSavePage(updatedContent);
      setDraggedElementData(null); // Consommer l'événement
    }
  }, [draggedElementData, parsedPageSettings]);

  // Traitement du Redimensionnement (Resize Handle)
  useEffect(() => {
    if (resizedElementData && parsedPageSettings.length > 0) {
      const element = parsedPageSettings.find((el: any) => {
        if (resizedElementData.text && el.originalText) {
           return el.originalText === resizedElementData.text || el.text === resizedElementData.text;
        } else if (resizedElementData.className && el.originalClassMatch) {
           const firstClass = resizedElementData.className.split(' ').filter(Boolean)[0];
           if (firstClass && el.originalClassMatch.includes(firstClass)) return true;
        }
        return false;
      });

      if (element) {
        let currentLayout = element.layout || "";
        currentLayout = currentLayout.replace(/w-\[-?\d+px\]/g, '').trim();
        currentLayout = currentLayout.replace(/h-\[-?\d+px\]/g, '').trim();
        
        currentLayout += ` w-[${resizedElementData.width}px] h-[${resizedElementData.height}px]`;
        currentLayout = currentLayout.trim();

        handleSavePageSetting(element, {
           size: element.size,
           color: element.color,
           layout: currentLayout,
           text: element.text
        });
      }
      setResizedElementData(null); // Consommer l'événement
    }
  }, [resizedElementData, parsedPageSettings]);

  // Définir des positions de calques coordonnées pour 2 éléments (topElement z-[9999], bottomElement z-[1])
  const setTwoElementLayers = (topElement: any, bottomElement: any) => {
    if (!topElement || !bottomElement) return;

    let layoutTop = (topElement.layout || "").replace(/z-\S+/g, '').replace(/\s+/g, ' ').trim();
    if (!layoutTop.includes('relative') && !layoutTop.includes('absolute') && !layoutTop.includes('fixed') && !layoutTop.includes('sticky')) {
      layoutTop = `relative ${layoutTop}`;
    }
    layoutTop = `${layoutTop} z-[9999]`.trim();

    let layoutBottom = (bottomElement.layout || "").replace(/z-\S+/g, '').replace(/\s+/g, ' ').trim();
    if (!layoutBottom.includes('relative') && !layoutBottom.includes('absolute') && !layoutBottom.includes('fixed') && !layoutBottom.includes('sticky')) {
      layoutBottom = `relative ${layoutBottom}`;
    }
    layoutBottom = `${layoutBottom} z-[1]`.trim();

    let updatedContent = pageContent;

    const updateSingleElementHTML = (el: any, newLayout: string, content: string) => {
      const newClasses = [el.size, el.color, newLayout].filter(Boolean).join(' ');
      let newAttrs = el.originalClassMatch;
      
      if (newClasses !== "") {
        if (el.originalClassMatch) {
          const quote = el.originalClassMatch.match(/['"]/)?.[0] || '"';
          newAttrs = `className=${quote}${newClasses}${quote}`;
        } else {
          newAttrs = ` className="${newClasses}"`;
        }
      } else {
        newAttrs = "";
      }

      let newHTML = el.originalMatch;
      if (el.originalClassMatch) {
        newHTML = newHTML.replace(el.originalClassMatch, newAttrs);
      } else if (newAttrs !== "") {
        const realTag = el.tag.replace('BLOC ', '').toLowerCase();
        newHTML = newHTML.replace(`<${realTag}`, `<${realTag}${newAttrs}`);
      }
      if (el.originalText !== null) {
        newHTML = newHTML.replace(el.originalText, el.text);
      }

      return content.replace(el.originalMatch, newHTML);
    };

    updatedContent = updateSingleElementHTML(topElement, layoutTop, updatedContent);
    updatedContent = updateSingleElementHTML(bottomElement, layoutBottom, updatedContent);

    pushHistoryState(updatedContent);
    setPageContent(updatedContent);
    handleSavePage(updatedContent);
  };

  useEffect(() => {
    if (collidedElementData && parsedPageSettings.length > 0) {
      const { dragged, collided } = collidedElementData;

      const draggedEl = parsedPageSettings.find((el: any) => {
        if (dragged.text && el.originalText) return el.originalText === dragged.text || el.text === dragged.text;
        if (dragged.className && el.originalClassMatch) {
          const first = dragged.className.split(' ').filter(Boolean)[0];
          if (first && el.originalClassMatch.includes(first)) return true;
        }
        return false;
      });

      const collidedEl = parsedPageSettings.find((el: any) => {
        if (collided.text && el.originalText) return el.originalText === collided.text || el.text === collided.text;
        if (collided.className && el.originalClassMatch) {
          const first = collided.className.split(' ').filter(Boolean)[0];
          if (first && el.originalClassMatch.includes(first)) return true;
        }
        return false;
      });

      if (draggedEl && collidedEl) {
        setTwoElementLayers(draggedEl, collidedEl);
      }
      setCollidedElementData(null);
    }
  }, [collidedElementData, parsedPageSettings]);

  const handleSwapLayers = () => {
    if (!clickedElementData || !Array.isArray(clickedElementData) || clickedElementData.length < 2) return;
    
    const item1 = clickedElementData[0];
    const item2 = clickedElementData[1];

    const el1 = parsedPageSettings.find((el: any) => {
      if (item1.text && el.originalText) return el.originalText === item1.text || el.text === item1.text;
      if (item1.className && el.originalClassMatch) {
        const first = item1.className.split(' ').filter(Boolean)[0];
        if (first && el.originalClassMatch.includes(first)) return true;
      }
      return false;
    });

    const el2 = parsedPageSettings.find((el: any) => {
      if (item2.text && el.originalText) return el.originalText === item2.text || el.text === item2.text;
      if (item2.className && el.originalClassMatch) {
        const first = item2.className.split(' ').filter(Boolean)[0];
        if (first && el.originalClassMatch.includes(first)) return true;
      }
      return false;
    });

    if (!el1 || !el2) return;

    const layout1 = el1.layout || "";
    const isEl1Top = layout1.includes('z-[50]') || layout1.includes('z-[9999]') || layout1.includes('z-[100]');

    if (isEl1Top) {
      setTwoElementLayers(el2, el1);
    } else {
      setTwoElementLayers(el1, el2);
    }
  };

  const handleTwoElementLayerChange = (currentEl: any, otherEl: any, plan: 'top' | 'up' | 'down' | 'bottom') => {
    if (plan === 'top') {
      setTwoElementLayers(currentEl, otherEl);
    } else if (plan === 'bottom') {
      setTwoElementLayers(otherEl, currentEl);
    } else {
      let l = (currentEl.layout || "").replace(/z-\S+/g, '').replace(/\s+/g, ' ').trim();
      if (!l.includes('relative') && !l.includes('absolute') && !l.includes('fixed') && !l.includes('sticky')) {
        l = `relative ${l}`;
      }
      const zClass = plan === 'up' ? 'z-[100]' : 'z-[1]';
      l = `${l} ${zClass}`.trim();
      handleSavePageSetting(currentEl, { size: currentEl.size, color: currentEl.color, layout: l, text: currentEl.text });
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project');

    if (!targetProject || targetProject === "../../v0-interface-versel") {
      // Cas 1 : Interface Admin V0 (L'IDE lui-même)
      safeFetch(`http://localhost:5006/api/fs/read?project=../../v0-interface-versel&file=src/design-tokens.json`)
        .then(res => res ? res.json() : null)
        .then(data => {
          if (data && data.success && data.content) {
            try {
              setDesign(prev => ({ ...prev, ...JSON.parse(data.content) }));
            } catch (e) { }
          }
        })
        .finally(() => setIsLoaded(true));
    } else {
      // Cas 2 : Projet Utilisateur (Lire le design-tokens.json du projet)
      safeFetch(`http://localhost:5006/api/fs/read?project=${targetProject}&file=src/design-tokens.json`)
        .then(res => res ? res.json() : null)
        .then(data => {
          let parsedDesign: Record<string, string> = {};
          if (data && data.success && data.content) {
             try {
                parsedDesign = JSON.parse(data.content);
             } catch(e) {}
          }

          // Fetch de l'arbre pour les fichiers du projet
          safeFetch(`http://localhost:5006/api/fs/tree?project=${targetProject}`)
              .then(resTree => resTree ? resTree.json() : null)
              .then(treeData => {
                let newStructure: Record<string, any> = {};
                if (treeData.success && treeData.tree) {
                  try {
                    const extractFolder = (node: any, targetFolder: string, outArr: string[]) => {
                      if (!node) return;
                      if (node.type === 'file' && node.name && node.name.endsWith('.tsx') && node.path && node.path.startsWith(targetFolder)) {
                        outArr.push(node.path);
                      }
                      if (node.children && Array.isArray(node.children)) {
                        node.children.forEach((child: any) => extractFolder(child, targetFolder, outArr));
                      }
                    };
                    
                    // Extract pages
                    const pagesArr: string[] = [];
                    extractFolder(treeData.tree, 'src/pages', pagesArr);
                    if (pagesArr.length > 0) {
                      newStructure["📁 src/pages"] = {};
                      pagesArr.forEach(path => {
                        const name = path.split('/').pop();
                        if (name) newStructure["📁 src/pages"][name] = [path];
                      });
                    }

                    // Extract components
                    const compArr: string[] = [];
                    extractFolder(treeData.tree, 'src/components', compArr);
                    if (compArr.length > 0) {
                      newStructure["📁 src/components"] = {};
                      compArr.forEach(path => {
                        const name = path.split('/').pop();
                        if (name) newStructure["📁 src/components"][name] = [path];
                      });
                    }

                    // Extract App.tsx explicitly
                    const findAppTsx = (node: any) => {
                      if (!node) return;
                      if (node.type === 'file' && node.name === 'App.tsx' && node.path === 'src/App.tsx') {
                         if (!newStructure["📁 Application"]) newStructure["📁 Application"] = {};
                         newStructure["📁 Application"]["App"] = ["src/App.tsx"];
                      }
                      if (node.children && Array.isArray(node.children)) {
                        node.children.forEach(findAppTsx);
                      }
                    };
                    findAppTsx(treeData.tree);
                  } catch (err) {
                    console.error("Erreur lors de l'extraction de l'arbre:", err);
                  }
                }

                // Fallback si l'arbre est vide
                if (Object.keys(newStructure).length === 0) {
                   newStructure = { "📁 Application": { "App": ["src/App.tsx"] } };
                }

                setDesign(prev => ({ ...prev, ...parsedDesign }));
                setDynamicStructure(newStructure);
                const firstCat = Object.keys(newStructure)[0];
                setActiveCategory(firstCat);
                setActiveSubCategory(Object.keys(newStructure[firstCat])[0] || "");
              }).catch((err) => {
                console.error("Erreur réseau fetch tree:", err);
                const fallbackProj = { "📁 Application": { "App": ["src/App.tsx"] } };
                setDesign(prev => ({ ...prev, ...parsedDesign }));
                setDynamicStructure(fallbackProj);
                setActiveCategory("📁 Application");
                setActiveSubCategory("App");
              });
        })
        .finally(() => setIsLoaded(true));
    }
  }, []);

  // Merge the IDE design parameters with the project's file explorer
  const currentStructure = dynamicStructure ? { ...designStructure, ...dynamicStructure } : designStructure;

  const formatKeyToCSSVar = (key: string) => {
    return '--' + key.replace(/([A-Z])/g, "-$1").toLowerCase();
  };

  const generateCSS = (d: typeof defaultDesign | Record<string, string>) => {
    let cssVars = '';
    for (const [key, value] of Object.entries(d)) {
      cssVars += `  ${formatKeyToCSSVar(key)}: ${value};\n`;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project');
    const isExternalProject = targetProject && targetProject !== "../../v0-interface-versel";

    if (isExternalProject) {
      // Si c'est un projet externe, on recrache juste les variables root
      return `/* Design Auto-Généré pour ${targetProject} */
:root {
${cssVars}
}
`;
    }
    
    // Sinon, c'est l'IDE, on crache tout le CSS complexe
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
   position: var(--grille-position, relative) !important;
   left: var(--grille-position-x, 0px) !important;
   top: var(--grille-position-y, 0px) !important;
   transform: translate(var(--grille-position-x, 0px), var(--grille-position-y, 0px)) !important;
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
   max-width: var(--chat-layout-max-largeur, 1200px) !important;
}

.design-chat-bulles {
   gap: var(--chat-bulles-espacement) !important;
}

.design-chat-bulle {
   font-size: var(--chat-bulle-taille-police, 15px) !important;
   padding: var(--chat-bulle-padding, 1.25rem) !important;
   border-radius: var(--chat-bulle-arrondi, 1.5rem) !important;
}

.design-msg-accueil {
   font-size: var(--msg-accueil-taille-police, 15px) !important;
   color: var(--msg-accueil-couleur, #f3f4f6) !important;
   background: var(--msg-accueil-bg, rgba(30, 27, 75, 0.6)) !important;
   padding: var(--msg-accueil-padding, 1.25rem) !important;
   border-radius: var(--msg-accueil-arrondi, 1.5rem) !important;
   max-width: var(--msg-accueil-largeur-max, 70%) !important;
   position: var(--msg-accueil-position, relative) !important;
   left: var(--msg-accueil-position-x, 0px) !important;
   top: var(--msg-accueil-position-y, 0px) !important;
   transform: translate(var(--msg-accueil-position-x, 0px), var(--msg-accueil-position-y, 0px)) !important;
}

.design-carte-carrousel-conteneur {
   height: var(--carte-carrousel-conteneur-hauteur) !important;
   width: var(--carte-carrousel-conteneur-largeur) !important;
   gap: var(--carte-carrousel-conteneur-gap, 1rem) !important;
   position: var(--carte-carrousel-conteneur-position) !important;
   left: var(--carte-carrousel-conteneur-position-x, 0px) !important;
   top: var(--carte-carrousel-conteneur-position-y, 0px) !important;
   transform: translate(var(--carte-carrousel-conteneur-position-x, 0px), var(--carte-carrousel-conteneur-position-y, 0px)) !important;
}

.design-carte-carrousel {
   height: var(--carte-carrousel-hauteur, auto) !important;
   min-height: 230px !important;
   width: var(--carte-carrousel-largeur) !important;
   gap: var(--carte-carrousel-gap, 1rem) !important;
   padding: var(--carte-carrousel-padding, 1.25rem) !important;
   border-radius: var(--carte-carrousel-arrondi, 1rem) !important;
   border: var(--carte-carrousel-bordure, 1px solid rgba(99, 102, 241, 0.3)) !important;
   background: var(--carte-carrousel-bg, rgba(30, 27, 75, 0.7)) !important;
   box-shadow: var(--carte-carrousel-ombre, 0 10px 25px -5px rgba(0, 0, 0, 0.5)) !important;
   transform: translate(var(--carte-carrousel-position-x, 0px), var(--carte-carrousel-position-y, 0px)) !important;
   transition: var(--carte-carrousel-transition) !important;
}

.design-carte-carrousel:hover {
   z-index: 50 !important;
   transform: translate(var(--carte-carrousel-position-x, 0px), var(--carte-carrousel-position-y, 0px)) scale(var(--app-icone-scale-survol, 1.25)) !important;
   box-shadow: var(--app-icone-ombre-survol, 0 0 30px rgba(255, 255, 255, 0.3)) !important;
}

.design-carte-carrousel .design-carte-titre {
   font-size: var(--carte-carrousel-titre-taille, 1.125rem) !important;
   color: var(--carte-carrousel-titre-couleur, #ffffff) !important;
   transition: all 0.3s ease;
}

.design-carte-carrousel:hover .design-carte-titre {
   font-size: calc(var(--carte-carrousel-titre-taille-survol, var(--carte-carrousel-titre-taille, 1.125rem)) / var(--carte-carrousel-scale-survol, 1)) !important;
}

.design-carte-carrousel .design-carte-desc {
   font-size: var(--carte-carrousel-texte-taille, 0.75rem) !important;
   color: var(--carte-carrousel-texte-couleur, #9ca3af) !important;
   transition: all 0.3s ease;
}

.design-carte-carrousel:hover .design-carte-desc {
   font-size: calc(var(--carte-carrousel-texte-taille-survol, var(--carte-carrousel-texte-taille, 0.75rem)) / var(--carte-carrousel-scale-survol, 1)) !important;
}

.design-carte-v0-guest {
   position: var(--carte-guest-position, relative) !important;
   left: var(--carte-guest-position-x, 0px) !important;
   top: var(--carte-guest-position-y, 0px) !important;
   transform: translate(var(--carte-guest-position-x, 0px), var(--carte-guest-position-y, 0px)) !important;
   width: var(--carte-guest-largeur, 280px) !important;
   margin-right: var(--carte-guest-marge-droite, 0px) !important;
   z-index: var(--carte-guest-z-index, 20) !important;
}

.design-prd-badge {
   font-size: var(--prd-badge-taille-police, 10px) !important;
   color: var(--prd-badge-couleur, #08b3c9) !important;
   background: var(--prd-badge-bg, rgba(8, 179, 201, 0.2)) !important;
}

.design-prd-btn {
   font-size: var(--prd-carte-bouton-taille-police, 12px) !important;
   background: var(--prd-carte-bouton-bg, rgba(8, 179, 201, 0.1)) !important;
   color: var(--prd-carte-bouton-couleur, #08b3c9) !important;
   padding: var(--prd-bouton-padding, 6px 12px) !important;
   border-radius: var(--prd-bouton-arrondi, 12px) !important;
   position: var(--prd-bouton-position, relative) !important;
   left: var(--prd-bouton-position-x, 0px) !important;
   top: var(--prd-bouton-position-y, 0px) !important;
   transform: translate(var(--prd-bouton-position-x, 0px), var(--prd-bouton-position-y, 0px)) !important;
}

.design-fenetre-readme {
   position: var(--fenetre-readme-position, relative) !important;
   left: var(--fenetre-readme-position-x, 0px) !important;
   top: var(--fenetre-readme-position-y, 0px) !important;
   transform: translate(var(--fenetre-readme-position-x, 0px), var(--fenetre-readme-position-y, 0px)) !important;
   max-width: var(--fenetre-readme-largeur-max, 1200px) !important;
   width: 100% !important;
   margin: 1rem auto !important;
   z-index: 50 !important;
}

.design-readme-contenu {
   max-height: var(--fenetre-readme-hauteur-max, 600px) !important;
   overflow-y: auto !important;
   font-size: var(--fenetre-readme-taille-police, 15px) !important;
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

/* --- CLASSES ESPACE IDE --- */
.design-ide-toolbar {
   height: var(--ide-toolbar-hauteur) !important;
   background: var(--ide-toolbar-bg) !important;
   border-bottom: var(--ide-toolbar-bordure) !important;
}

.design-ide-btn-action {
   width: var(--ide-btn-action-taille) !important;
   height: var(--ide-btn-action-taille) !important;
   border-radius: var(--ide-btn-action-arrondi) !important;
   background: var(--ide-btn-action-bg) !important;
   border: var(--ide-btn-action-bordure) !important;
   font-size: var(--ide-btn-action-emoji) !important;
}

.design-explorateur {
   width: var(--explorateur-largeur) !important;
   background: var(--explorateur-bg) !important;
   border-right: var(--explorateur-bordure-droite) !important;
}

.design-explorateur-texte {
   font-size: var(--explorateur-texte-taille) !important;
}

.design-explorateur-dossier {
   color: var(--explorateur-dossier-couleur) !important;
}

.design-explorateur-fichier {
   color: var(--explorateur-fichier-couleur) !important;
}

.design-editeur {
   background: var(--editeur-bg) !important;
}

.design-editeur-onglet {
   height: var(--editeur-onglet-hauteur) !important;
   background: var(--editeur-onglet-bg) !important;
   border-bottom: var(--editeur-onglet-bordure) !important;
}

.design-preview {
   background: var(--preview-bg) !important;
   width: var(--preview-largeur) !important;
   border-left: var(--preview-bordure-gauche) !important;
}
`;
  };

  useEffect(() => {
    if (!isLoaded) return; // Ne JAMAIS sauvegarder avant d'avoir chargé les tokens du projet !

    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project') || "../../v0-interface-versel";

    const timer = setTimeout(() => {
      fetch("http://localhost:5006/api/fs/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: targetProject, file: "src/design.css", content: generateCSS(design) })
      }).catch(console.error);

      // Si projet externe, sauvegarder aussi les tokens
      if (targetProject !== "../../v0-interface-versel") {
        fetch("http://localhost:5006/api/fs/write", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: targetProject, file: "src/design-tokens.json", content: JSON.stringify(design, null, 2) })
        }).catch(console.error);
      }
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
    const urlParams = new URLSearchParams(window.location.search);
    const targetProject = urlParams.get('project') || "../../v0-interface-versel";

    fetch("http://localhost:5006/api/fs/write", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: targetProject, file: "src/design-tokens.json", content: JSON.stringify(design, null, 2) })
    })
    .then(() => alert(`✅ Réglages GRAVÉS dans le projet ${targetProject} !`))
    .catch(err => alert("❌ Erreur lors de la sauvegarde : " + err.message));
  };

  const isColor = (val: string) => val.startsWith('#') || val.startsWith('rgba') || val.startsWith('rgb');

  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-sans">
        <span className="w-6 h-6 rounded-full bg-cyan animate-ping mb-4"></span>
        <p className="text-cyan font-bold tracking-widest text-sm">CHARGEMENT DES PARAMÈTRES DU PROJET...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan to-pink-500">TIGER OMNI-ADMIN STUDIO</h1>
        </div>
        <div className="flex items-center gap-4">
          {themeApplyMessage && (
            <div className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-pulse">
              {themeApplyMessage}
            </div>
          )}
          <button 
            onClick={() => { fetchThemes(); setShowThemeModal(true); }}
            className="text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg border border-purple-400/40 flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 cursor-pointer"
            title="Ouvrir la Galerie de Thèmes (DESIGN.md)"
          >
            🎨 THÈMES (DESIGN.MD)
          </button>
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

      {/* MODAL GALERIE DE THÈMES & DESIGN.MD */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#0e0e10] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-[0_0_60px_rgba(139,92,246,0.3)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-black/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎨</span>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Galerie de Thèmes & DESIGN.md</h2>
                    <p className="text-xs text-gray-400">Application 1-Clic zéro-touch (Seules les variables CSS sont modifiées)</p>
                  </div>
                </div>
                <button onClick={() => setShowThemeModal(false)} className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">✕</button>
              </div>

              {/* BARRE DE SÉLECTION DE LA PORTÉE DU THÈME */}
              <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">🎯 Portée d'application :</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setThemeScope('global')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${themeScope === 'global' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
                  >
                    🌐 Tout le Projet (Global)
                  </button>
                  <button
                    onClick={() => setThemeScope('page')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${themeScope === 'page' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)] border border-pink-400' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
                  >
                    🎯 Page Spécifique Uniquement
                  </button>
                </div>

                {themeScope === 'page' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-pink-300 font-bold">Cible :</span>
                    <select
                      value={selectedPageScope}
                      onChange={(e) => setSelectedPageScope(e.target.value)}
                      className="bg-[#18181b] border border-pink-500/50 text-pink-300 text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Cockpit">🚀 Cockpit</option>
                      <option value="Dashboard">📊 Dashboard</option>
                      <option value="Agents">🤖 Agents</option>
                      <option value="Skills">⚡ Skills</option>
                      <option value="Settings">⚙️ Settings</option>
                      <option value="Psychology">🧠 Psychology</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">

              {availableThemes.length > 0 ? (
                availableThemes.map(theme => (
                  <div key={theme.id} className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:bg-white/10 group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                          {theme.name}
                        </h3>
                        <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 font-bold">
                          {theme.type === 'md' ? '💎 DESIGN.MD' : '🎨 CSS PRESET'}
                        </span>
                      </div>

                      {/* Swatches preview */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div style={{ backgroundColor: theme.colors?.primary || '#8b5cf6' }} className="h-10 rounded-lg border border-white/10 flex items-end p-1 text-[9px] font-mono text-white/90 font-bold shadow-sm">Primary</div>
                        <div style={{ backgroundColor: theme.colors?.secondary || '#3b82f6' }} className="h-10 rounded-lg border border-white/10 flex items-end p-1 text-[9px] font-mono text-white/90 font-bold shadow-sm">Secondary</div>
                        <div style={{ backgroundColor: theme.colors?.tertiary || '#06b6d4' }} className="h-10 rounded-lg border border-white/10 flex items-end p-1 text-[9px] font-mono text-white/90 font-bold shadow-sm">Tertiary</div>
                        <div style={{ backgroundColor: theme.colors?.neutral || '#131315' }} className="h-10 rounded-lg border border-white/10 flex items-end p-1 text-[9px] font-mono text-white/90 font-bold shadow-sm">Neutral</div>
                      </div>


                      <div className="text-xs text-gray-400 flex items-center gap-4 font-mono">
                        <span>Polices: Outfit / Inter</span>
                        <span>Arrondis: 0.75rem</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyTheme(theme)}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.01] cursor-pointer"
                    >
                      ✨ Enregistrer et Appliquer Thème
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-400 text-sm">
                  Chargement des thèmes depuis e:\v0reponses\themes et DESIGN.md...
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: 2-LEVEL NAVIGATION (PAGES -> COMPOSANTS) */}
        <div className="w-80 bg-black/40 border-r border-white/10 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h2 className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-6 pl-2 border-b border-white/5 pb-2">Arborescence du Design</h2>
            
            <div className="space-y-4">
              {Object.keys(currentStructure).map(cat => (
                <div key={cat} className="flex flex-col">
                  {/* Niveau 1 : Page ou Zone Globale */}
                  <button 
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSubCategory(Object.keys((currentStructure as any)[cat])[0]);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-[13px] font-black uppercase transition-all flex justify-between items-center ${activeCategory === cat ? 'bg-gradient-to-r from-cyan/20 to-pink-500/10 text-white border-l-4 border-cyan shadow-[0_0_15px_rgba(8,179,201,0.2)]' : 'text-gray-400 hover:bg-white/5 border-l-4 border-transparent'}`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-50">{activeCategory === cat ? '▼' : '▶'}</span>
                  </button>
                  
                  {/* Niveau 2 : Sous-composants */}
                  {activeCategory === cat && (
                    <div className="mt-2 ml-4 pl-3 border-l border-white/10 flex flex-col gap-1 relative before:absolute before:top-0 before:left-[-1px] before:w-[2px] before:h-full before:bg-gradient-to-b before:from-cyan/50 before:to-transparent">
                      {Object.keys((currentStructure as any)[cat]).map(subcat => (
                        <button
                          key={subcat}
                          onClick={() => {
                            setActiveSubCategory(subcat);
                            if (cat.startsWith("📁")) {
                               let route = "/";
                               if (subcat === 'AgentsManagement.tsx') route = '/agents';
                               else if (subcat === 'ProfileSettings.tsx') route = '/profile';
                               else if (subcat === 'SkillsLibrary.tsx') route = '/skills';
                               else if (subcat === 'SystemActivity.tsx') route = '/activity';
                               else if (subcat === 'Dashboard.tsx') route = '/';
                               window.parent.postMessage({ type: 'CHANGE_PREVIEW_URL', route }, '*');
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-md text-xs font-bold transition-all relative ${activeSubCategory === subcat ? 'bg-white/10 text-cyan translate-x-1 shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
                        >
                          {subcat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* BOUTONS UNDO / REDO (HISTORIQUE DE 8 NIVEAUX) */}
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Historique d'Édition (Snapshots)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${historyIndex > 0 ? 'bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer shadow-sm' : 'bg-black/20 text-gray-600 border-white/5 cursor-not-allowed opacity-50'}`}
                  title="Annuler la dernière modification"
                >
                  ↩️ Annuler ({historyIndex})
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${historyIndex < historyStack.length - 1 ? 'bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer shadow-sm' : 'bg-black/20 text-gray-600 border-white/5 cursor-not-allowed opacity-50'}`}
                  title="Rétablir la modification suivante"
                >
                  ↪️ Rétablir
                </button>
              </div>
            </div>

            {/* FLOATING DESIGN INSPECTOR DRAWER (POSITIONNÉ SOUS ANNULER / RÉTABLIR) */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-4">
              <div className="bg-[#121215]/95 border border-white/10 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                {/* Header matching mockup image */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-400 font-bold">🎨</span>
                    <h3 className="text-xs font-bold text-white tracking-wide">{activeThemeName}</h3>
                    <span className="text-[10px] text-gray-500 font-mono">DESIGN.md</span>
                  </div>
                  <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-[9px] font-bold">
                    <button 
                      onClick={() => setDrawerTab('theme')} 
                      className={`px-2 py-0.5 rounded-lg transition-all ${drawerTab === 'theme' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Theme
                    </button>
                    <button 
                      onClick={() => setDrawerTab('md')} 
                      className={`px-2 py-0.5 rounded-lg transition-all ${drawerTab === 'md' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      DESIGN.md
                    </button>
                  </div>
                </div>

                {/* Color Swatch Big Indicator */}
                <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div style={{ backgroundColor: activeColor }} className="w-8 h-8 rounded-lg border border-white/20 shadow-md shrink-0" />
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 block uppercase">Couleur Active</span>
                    <span className="text-xs font-mono font-bold text-white uppercase">{activeColor}</span>
                  </div>
                  <input
                    type="color"
                    value={activeColor.startsWith('#') && activeColor.length === 7 ? activeColor : '#8b5cf6'}
                    onChange={(e) => setActiveColor(e.target.value)}
                    className="ml-auto w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
                    title="Changer la couleur active"
                  />
                </div>

                {/* Color Palette List */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Color Palette</span>
                  
                  {[
                    { label: 'Primary', color: '#8b5cf6' },
                    { label: 'Secondary', color: '#3b82f6' },
                    { label: 'Tertiary', color: '#06b6d4' },
                    { label: 'Neutral', color: '#09090b' }
                  ].map((item) => (
                    <div 
                      key={item.label} 
                      onClick={() => setActiveColor(item.color)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${activeColor === item.color ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ backgroundColor: item.color }} className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" />
                        <span className="text-xs font-bold text-gray-200">{item.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400">{item.color}</span>
                    </div>
                  ))}
                </div>

                {/* Police & Typographie */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Police & Typographie</span>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">Outfit</span>
                      <span className="text-[9px] text-gray-400">Headline</span>
                    </div>
                    <span className="text-lg font-bold font-sans">Aa</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">Inter</span>
                      <span className="text-[9px] text-gray-400">Body</span>
                    </div>
                    <span className="text-lg font-bold font-sans">Aa</span>
                  </div>
                </div>

                {/* Arrondi d'angle */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Arrondi d'angle</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '0px', val: '0rem' },
                      { label: '8px', val: '0.5rem' },
                      { label: '12px', val: '0.75rem' },
                      { label: 'Full', val: '9999px' }
                    ].map(r => (
                      <button
                        key={r.label}
                        onClick={() => {
                          setActiveRadius(r.val);
                          setThemeApplyMessage(`📐 Arrondi appliqué : ${r.label}`);
                          setTimeout(() => setThemeApplyMessage(null), 2500);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all ${activeRadius === r.val ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleApplyPaintBucket}
                    className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🪣 Pot Peinture
                  </button>

                  <button
                    onClick={() => {
                      const themeObj = availableThemes.find(t => t.name.includes(activeThemeName)) || availableThemes[0];
                      if (themeObj) handleApplyTheme(themeObj);
                    }}
                    className="py-2 px-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ✨ Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* RIGHT: DYNAMIC CONTROLS */}
        <div className="flex-1 bg-[#0a0a0a] p-8 overflow-y-auto custom-scrollbar relative">
          
          <div className="max-w-5xl mx-auto pb-32">
            <div className="mb-10 flex flex-col gap-2 border-b border-white/10 pb-6">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{activeCategory}</span>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan to-pink-500">
                {activeSubCategory}
              </h2>
            </div>
            
            {activeCategory.startsWith("📁") ? (
              <div className="flex flex-col gap-6 col-span-full">
                {activePagePath && (
                  <div className="flex flex-col items-center gap-4 mb-4 mx-auto w-full">
                    {/* PANNEAU MODE DESIGN ET PERSISTANCE */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 w-full shadow-md">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleDesignMode}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                            isDesignMode
                              ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-105 border border-emerald-400'
                              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
                          }`}
                          title={isDesignMode ? "Désactiver le Mode Design pour tester l'application en direct" : "Activer le Mode Design pour modifier le style"}
                        >
                          {isDesignMode ? '🎨 Mode Design : ACTIVÉ' : '🚀 Mode Design : DÉSACTIVÉ (App Live)'}
                        </button>

                        <span className="text-xs font-medium text-gray-400 hidden sm:inline">
                          {isDesignMode ? '(Souris active pour glisser, redimensionner, calques)' : '(Boutons cliquables, navigation & backend actifs)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowUiUpdateModal(true)}
                          className="px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 flex items-center gap-2"
                          title="Injecter un nouveau code V0 sans écraser la logique React"
                        >
                          🪄 Push Design (Strict)
                        </button>
                        <button
                          onClick={handleManualSave}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
                            isSavedButton
                              ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-105 border border-emerald-400'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md'
                          }`}
                          title="Sauvegarder définitivement toutes les modifications dans les fichiers source TSX"
                        >
                          {isSavedButton ? '✅ Sauvegarde Validée !' : '💾 Sauvegarder le Projet'}
                        </button>
                      </div>
                    </div>

                    {/* MODAL STRICT UI UPDATE */}
                    {showUiUpdateModal && (
                      <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#121215] border border-blue-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4">
                          <h3 className="text-xl font-black text-blue-400 flex items-center gap-2">
                            <span>🪄</span> Push Design (Mise à jour Stricte)
                          </h3>
                          <p className="text-sm text-gray-400">
                            Indiquez le nom du fichier ZIP téléchargé depuis V0 et copié dans la racine de votre projet (ex: <strong>v0-design.zip</strong>). L'IA va extraire le ZIP, analyser le HTML, et injecter le nouveau style visuel dans <strong>{activePagePath}</strong> tout en préservant 100% de la logique React.
                          </p>
                          <input 
                            type="text"
                            value={newV0Html}
                            onChange={(e) => setNewV0Html(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-cyan outline-none focus:border-blue-500 transition-colors"
                            placeholder="v0-design.zip"
                          />
                          <div className="flex items-center justify-end gap-3 mt-2">
                            <button 
                              onClick={() => setShowUiUpdateModal(false)}
                              disabled={isUiUpdateLoading}
                              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                            <button 
                              onClick={handleStrictUiUpdate}
                              disabled={isUiUpdateLoading || !newV0Html.trim()}
                              className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUiUpdateLoading ? (
                                <>
                                  <span className="animate-spin text-lg">⏳</span> Fusion en cours (15-30s)...
                                </>
                              ) : (
                                "🚀 Déployer la Mise à Jour"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {saveSuccessMessage && (
                      <div className="w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 p-2.5 rounded-xl text-xs font-bold text-center animate-pulse">
                        {saveSuccessMessage}
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                      <button onClick={() => { setPageFilter('all'); setClickedElementData(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pageFilter === 'all' && !clickedElementData ? 'bg-cyan text-black' : 'text-gray-400 hover:text-white'}`}>Tout voir</button>
                      <button onClick={() => { setPageFilter('text'); setClickedElementData(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pageFilter === 'text' && !clickedElementData ? 'bg-cyan text-black' : 'text-gray-400 hover:text-white'}`}>📝 Textes uniquement</button>
                      <button onClick={() => { setPageFilter('blocks'); setClickedElementData(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pageFilter === 'blocks' && !clickedElementData ? 'bg-cyan text-black' : 'text-gray-400 hover:text-white'}`}>🔲 Blocs & Fonds</button>
                    </div>
                    {clickedElementData && (
                      Array.isArray(clickedElementData) && clickedElementData.length >= 2 ? (
                        <div className="bg-pink-500/20 text-pink-300 px-5 py-3 rounded-xl border border-pink-500/50 flex items-center justify-between gap-4 text-sm font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎯</span>
                            <span>Mode {clickedElementData.length} Éléments Liés</span>
                            <span className="text-xs font-normal text-pink-200">(Ctrl + Clic dans la preview)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setClickedElementData(null)} className="hover:text-white hover:bg-black/80 bg-black/40 px-2.5 py-1 rounded-lg transition-colors text-xs">
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-pink-500/20 text-pink-300 px-4 py-2 rounded-lg border border-pink-500/50 flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                          🎯 Mode Ciblage Actif (Sélection via Preview)
                          <button onClick={() => setClickedElementData(null)} className="ml-2 hover:text-white hover:bg-black/80 bg-black/40 px-2 py-0.5 rounded transition-colors text-xs">Annuler</button>
                        </div>
                      )
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {activePagePath ? (
                    parsedPageSettings.length > 0 ? (
                      parsedPageSettings
                        .filter((element: any) => {
                          if (clickedElementData) {
                            if (Array.isArray(clickedElementData)) {
                               return clickedElementData.some((item: any) => {
                                  if (item.text && element.originalText) {
                                     return element.originalText === item.text || element.text === item.text;
                                  } else if (item.className && element.originalClassMatch) {
                                     const firstClass = item.className.split(' ').filter(Boolean)[0];
                                     if (firstClass && element.originalClassMatch.includes(firstClass)) return true;
                                  }
                                  return false;
                               });
                            }
                            if (clickedElementData.text && element.originalText) {
                               return element.originalText === clickedElementData.text || element.text === clickedElementData.text;
                            } else if (clickedElementData.className && element.originalClassMatch) {
                               const firstClass = clickedElementData.className.split(' ').filter(Boolean)[0];
                               if (firstClass && element.originalClassMatch.includes(firstClass)) return true;
                            }
                            return false;
                          }
                          if (pageFilter === 'all') return true;
                          if (pageFilter === 'text') return element.originalText !== null;
                          if (pageFilter === 'blocks') return element.originalText === null;
                          return true;
                        })
                        .map((element: any, idx: number) => {
                          let onSetLayer: any = undefined;
                          if (Array.isArray(clickedElementData) && clickedElementData.length >= 2) {
                            const otherItem = clickedElementData.find((item: any) => {
                               if (item.text && element.originalText) return !(element.originalText === item.text || element.text === item.text);
                               if (item.className && element.originalClassMatch) {
                                  const first = item.className.split(' ').filter(Boolean)[0];
                                  return first ? !element.originalClassMatch.includes(first) : true;
                               }
                               return true;
                            });
                            if (otherItem) {
                               const otherEl = parsedPageSettings.find((el: any) => {
                                  if (otherItem.text && el.originalText) return el.originalText === otherItem.text || el.text === otherItem.text;
                                  if (otherItem.className && el.originalClassMatch) {
                                     const first = otherItem.className.split(' ').filter(Boolean)[0];
                                     if (first && el.originalClassMatch.includes(first)) return true;
                                  }
                                  return false;
                               });
                               if (otherEl) {
                                  onSetLayer = (plan: 'top' | 'up' | 'down' | 'bottom') => handleTwoElementLayerChange(element, otherEl, plan);
                               }
                            }
                          }
                          return (
                            <ElementSettingCard 
                              key={`${element.id}_${idx}`} 
                              element={element} 
                              onSave={handleSavePageSetting} 
                              onSetLayer={onSetLayer}
                            />
                          );
                        })
                    ) : (
                      <div className="col-span-full flex items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed h-40">
                        Aucun paramètre texte modifiable trouvé dans cette page.
                      </div>
                    )
                  ) : (
                    <div className="col-span-full flex items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed h-40">
                      Sélectionnez un fichier dans le menu de gauche pour éditer ses paramètres.
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentStructure[activeCategory] && (currentStructure as any)[activeCategory][activeSubCategory] &&
                  (currentStructure as any)[activeCategory][activeSubCategory].map((key: string) => {
                    const val = (design as any)[key];
                if (val === undefined) return null;

                const cssVarName = formatKeyToCSSVar(key);

                // --- SMART AUTO-RENDERER ---
                // 1. Génération du nom ludique avec Emojis
                const getLudicLabel = (k: string) => {
                  if (k === 'iconeReglagesBg') return '🎨 Fond Icône ⚙️ Réglages';
                  if (k === 'iconeAssistantBg') return '🎨 Fond Icône 🧠 Assistant IA';
                  if (k === 'iconeProjetsBg') return '🎨 Fond Icône 📁 Projets';
                  if (k === 'iconePacksBg') return '🎨 Fond Icône 💎 Packs PRD';
                  if (k === 'iconeActualitesBg') return '🎨 Fond Icône 📰 Actualités';
                  if (k === 'chatLayoutGap') return '📐 Conteneur Principal Gap';
                  if (k === 'chatLayoutMaxLargeur') return '↔️ Conteneur Principal Max Largeur';
                  if (k === 'chatLayoutLargeur') return '↔️ Conteneur Principal Largeur';
                  if (k === 'chatLayoutHauteur') return '↕️ Conteneur Principal Hauteur';
                  if (k === 'chatLayoutPosition') return '📌 Conteneur Principal Position';
                  if (k === 'chatLayoutPositionX') return '📌 Conteneur Principal Position X';
                  if (k === 'chatLayoutPositionY') return '📌 Conteneur Principal Position Y';
                  if (k === 'carteCarrouselConteneurHauteur') return '↕️ Conteneur Carrousel Hauteur';
                  if (k === 'carteCarrouselConteneurLargeur') return '↔️ Conteneur Carrousel Largeur';
                  if (k === 'carteCarrouselConteneurGap') return '📐 Conteneur Carrousel Espacement';
                  if (k === 'carteCarrouselConteneurPosition') return '📌 Conteneur Carrousel Position';
                  if (k === 'carteCarrouselConteneurPositionX') return '📌 Conteneur Carrousel Position X';
                  if (k === 'carteCarrouselConteneurPositionY') return '📌 Conteneur Carrousel Position Y';

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
                const keyLow = key.toLowerCase();
                const isPosXY = keyLow.includes('positionx') || keyLow.includes('positiony') || keyLow.includes('posx') || keyLow.includes('posy');
                const isPosition = !isPosXY && (keyLow.endsWith('position') || keyLow.includes('positiontype') || keyLow === 'headerposition' || keyLow === 'footerposition' || keyLow === 'chatmainposition' || keyLow === 'sidebardroiteposition' || keyLow === 'newv0position' || keyLow === 'tromboneposition' || keyLow === 'chatlayoutposition' || keyLow === 'cartecarrouselconteneurposition');
                const isDisplay = keyLow.includes('display');
                const isFlexWrap = keyLow.includes('flexwrap');
                const isJustify = keyLow.includes('justify');
                const isOverflow = keyLow.includes('overflow');
                const isLocked = !!lockedSettings[key];

                const sliderMatch = typeof val === 'string' ? val.match(/^(-?\d+\.?\d*)(px|vw|vh|%|rem|em)$/) : null;
                const isDimension = keyLow.includes('hauteur') || keyLow.includes('largeur') || keyLow.includes('gap') || keyLow.includes('padding') || keyLow.includes('margin');
                const effectiveSlider = sliderMatch || (isPosXY ? [val, (val.match(/^(-?\d+\.?\d*)/)?.[1] || "0"), "px"] : (isDimension ? [val, "600", "px"] : null));

                return (
                  <div key={key} className={`bg-white/5 p-6 rounded-2xl border transition-all shadow-lg flex flex-col justify-between group ${isLocked ? 'border-red-500/30 opacity-75' : 'border-white/10 hover:border-cyan/50 hover:bg-white/10 hover:-translate-y-1'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <label className="block text-sm font-black text-white mb-2 drop-shadow-md">{ludicLabel}</label>
                        <code className="text-[10px] bg-black/50 px-2 py-1 rounded text-cyan block font-mono opacity-80 border border-cyan/20">var({cssVarName})</code>
                      </div>
                      <button 
                        onClick={() => toggleLock(key)} 
                        className={`p-2.5 rounded-xl text-lg transition-all ${isLocked ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-black/50 text-gray-500 hover:text-white border border-white/5 hover:border-white/30 hover:shadow-lg hover:bg-white/10'}`}
                        title={isLocked ? "Déverrouiller" : "Verrouiller ce réglage"}
                      >
                        {isLocked ? '🔒' : '🔓'}
                      </button>
                    </div>
                    
                    {isPosition ? (
                      (() => {
                        const posXKey = (key.replace(/Position$/, '') + 'PositionX') as any;
                        const posXVal = (design as any)[posXKey] || '0px';
                        return (
                          <div className="flex flex-col gap-3">
                            <select 
                              value={val} 
                              onChange={(e) => handleChange(key as any, e.target.value)} 
                              disabled={isLocked}
                              className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}
                            >
                              <option value="relative">Relative</option>
                              <option value="absolute">Absolute</option>
                              <option value="fixed">Fixed</option>
                              <option value="sticky">Sticky</option>
                              <option value="static">Static</option>
                            </select>
                            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                <span>📐 Glissement Position X (Slide Bar)</span>
                                <span className="text-cyan font-mono font-black">{posXVal}</span>
                              </label>
                              <div className="flex justify-between items-center bg-black/60 p-3 rounded-xl border border-white/10 transition-colors hover:border-white/30">
                                <input 
                                  type="range" 
                                  min={-1000} 
                                  max={1000} 
                                  value={parseInt(posXVal.replace('px', '')) || 0} 
                                  disabled={isLocked}
                                  onChange={(e) => handleChange(posXKey, `${e.target.value}px`)} 
                                  className={`w-full accent-cyan ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : isDisplay ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}>
                        <option value="flex">flex</option>
                        <option value="grid">grid</option>
                        <option value="block">block</option>
                        <option value="none">none</option>
                      </select>
                    ) : isFlexWrap ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}>
                        <option value="nowrap">nowrap</option>
                        <option value="wrap">wrap</option>
                        <option value="wrap-reverse">wrap-reverse</option>
                      </select>
                    ) : isJustify ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}>
                        <option value="flex-start">flex-start</option>
                        <option value="flex-end">flex-end</option>
                        <option value="center">center</option>
                        <option value="space-between">space-between</option>
                        <option value="space-around">space-around</option>
                        <option value="space-evenly">space-evenly</option>
                      </select>
                    ) : isOverflow ? (
                      <select value={val} onChange={(e) => handleChange(key as any, e.target.value)} disabled={isLocked} className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}>
                        <option value="visible">visible</option>
                        <option value="hidden">hidden</option>
                        <option value="scroll">scroll</option>
                        <option value="auto">auto</option>
                      </select>
                    ) : isColorVal && val.startsWith('#') ? (
                      <div className={`flex items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/10 transition-colors ${isLocked ? 'opacity-50' : 'hover:border-white/30'}`}>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 shadow-inner shrink-0">
                          <input type="color" value={val} disabled={isLocked} onChange={(e) => handleChange(key as any, e.target.value)} className={`absolute top-[-10px] left-[-10px] w-20 h-20 bg-transparent border-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
                        </div>
                        <input type="text" value={val} disabled={isLocked} onChange={(e) => handleChange(key as any, e.target.value)} className={`w-full bg-transparent border-none text-base text-white font-mono font-bold outline-none ${isLocked ? 'cursor-not-allowed' : ''}`} />
                      </div>
                    ) : effectiveSlider ? (
                      <div className={`flex flex-col gap-3 ${isLocked ? 'opacity-50' : ''}`}>
                        {isPosXY && (
                          <div className="flex items-center gap-2 mb-1 bg-black/40 p-2.5 rounded-xl border border-white/10">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Mode Position :</label>
                            <select
                              value={(design as any)[key.includes('prdTitreSection') ? 'prdTitreSectionPosition' : key.includes('fenetreReadme') ? 'fenetreReadmePosition' : key.includes('grille') ? 'grillePosition' : key.includes('prdBouton') ? 'prdBoutonPosition' : key.includes('msgAccueil') ? 'msgAccueilPosition' : 'carteCarrouselPosition'] || 'relative'}
                              onChange={(e) => handleChange((key.includes('prdTitreSection') ? 'prdTitreSectionPosition' : key.includes('fenetreReadme') ? 'fenetreReadmePosition' : key.includes('grille') ? 'grillePosition' : key.includes('prdBouton') ? 'prdBoutonPosition' : key.includes('msgAccueil') ? 'msgAccueilPosition' : 'carteCarrouselPosition') as any, e.target.value)}
                              disabled={isLocked}
                              className={`w-full bg-black/80 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-cyan outline-none font-mono font-bold ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/30'}`}
                            >
                              <option value="relative">Relative</option>
                              <option value="absolute">Absolute</option>
                              <option value="fixed">Fixed</option>
                              <option value="sticky">Sticky</option>
                              <option value="static">Static</option>
                            </select>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-black/60 p-3 rounded-xl border border-white/10 transition-colors hover:border-white/30">
                          <input 
                            type="range" 
                            min={isPosXY ? -1000 : (effectiveSlider[2] === '%' ? 0 : -500)} 
                            max={isPosXY ? 1000 : (effectiveSlider[2] === '%' ? 100 : (effectiveSlider[2] === 'px' ? 1500 : 200))} 
                            value={effectiveSlider[1]} 
                            disabled={isLocked}
                            onChange={(e) => handleChange(key as any, `${e.target.value}${effectiveSlider[2] || 'px'}`)} 
                            className={`w-full accent-cyan ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            value={effectiveSlider[1]}
                            disabled={isLocked}
                            onChange={(e) => handleChange(key as any, `${e.target.value}${effectiveSlider[2] || 'px'}`)}
                            className={`w-24 bg-black/80 border border-white/10 rounded-lg p-2 text-sm text-right text-white focus:border-cyan outline-none font-mono font-black ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:border-white/30'}`}
                          />
                          <span className={`text-sm font-mono font-black px-3 py-2 rounded-lg border shadow-sm ${isLocked ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-cyan bg-cyan/10 border-cyan/30'}`}>
                            {effectiveSlider[2] || 'px'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        {isColorVal && (
                          <div className="flex items-center gap-1.5 flex-wrap bg-black/60 p-2.5 rounded-xl border border-white/10 shadow-inner">
                            <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Nuancier :</span>
                            {[
                              { label: 'Jaune Bouton / Warning', color: '#ffe600' },
                              { label: 'Vert Succès / Card Bg', color: '#10b981' },
                              { label: 'Violet Primary', color: '#8b5cf6' },
                              { label: 'Bleu Secondary', color: '#3b82f6' },
                              { label: 'Cyan Tertiary', color: '#06b6d4' },
                              { label: 'Rose Accent', color: '#ec4899' },
                              { label: 'Or Vibrant', color: '#f59e0b' },
                              { label: 'Fond Sombre', color: '#131315' }
                            ].map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => !isLocked && handleChange(key as any, c.color)}
                                style={{ backgroundColor: c.color }}
                                className="w-6 h-6 rounded-lg border border-white/30 hover:scale-125 transition-all shadow-md cursor-pointer hover:border-white active:scale-95"
                                title={`Appliquer ${c.label} (${c.color})`}
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {isColorVal && (
                            <input
                              type="color"
                              value={val.startsWith('#') && val.length === 7 ? val : '#8b5cf6'}
                              disabled={isLocked}
                              onChange={(e) => handleChange(key as any, e.target.value)}
                              className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
                              title="Choisir une couleur sur la roue"
                            />
                          )}
                          <input 
                            type="text" 
                            value={val} 
                            disabled={isLocked}
                            onChange={(e) => handleChange(key as any, e.target.value)} 
                            className={`w-full bg-black/80 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan outline-none transition-colors font-mono font-bold shadow-inner ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:border-white/30'}`}
                            placeholder="ex: #ffe600, rgba(...)"
                          />
                        </div>
                        {key === 'carteCarrouselScaleSurvol' && (
                          <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mt-2">
                             <div className="flex justify-between items-center">
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">📏 Titre <span className="text-cyan">Survol</span></label>
                               <input type="text" value={(design as any)['carteCarrouselTitreTailleSurvol'] || '1.125rem'} onChange={(e) => handleChange('carteCarrouselTitreTailleSurvol', e.target.value)} disabled={isLocked} className="w-24 bg-black/80 border border-white/10 rounded-lg p-1.5 text-xs text-right text-white focus:border-cyan outline-none font-mono" />
                             </div>
                             <div className="flex justify-between items-center">
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">📏 Texte <span className="text-cyan">Survol</span></label>
                               <input type="text" value={(design as any)['carteCarrouselTexteTailleSurvol'] || '0.75rem'} onChange={(e) => handleChange('carteCarrouselTexteTailleSurvol', e.target.value)} disabled={isLocked} className="w-24 bg-black/80 border border-white/10 rounded-lg p-1.5 text-xs text-right text-white focus:border-cyan outline-none font-mono" />
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDesignApp;


