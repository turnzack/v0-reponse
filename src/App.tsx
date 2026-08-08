"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from '@monaco-editor/react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Diamond, X, CheckCircle2 } from 'lucide-react';
import { ALL_PRD_PACKS as AVAILABLE_PACKS } from './data/prds';

type WidgetType = "projects" | "settings" | "news" | "youtube" | "phases" | null;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  widget?: WidgetType;
}

const getRandomGradient = (alpha = 1) => {
  if (typeof window === 'undefined') return `linear-gradient(135deg, rgba(17,17,17,${alpha}), rgba(34,34,34,${alpha}))`;
  const palettes = [
    [[42, 42, 114], [0, 159, 253]], [[249, 83, 198], [185, 29, 115]], 
    [[255, 153, 102], [255, 94, 98]], [[0, 180, 219], [0, 131, 176]], 
    [[142, 45, 226], [74, 0, 224]], [[17, 153, 142], [56, 239, 125]], 
    [[252, 74, 26], [247, 183, 51]], [[21, 153, 87], [21, 87, 153]], 
    [[0, 0, 70], [28, 181, 224]], [[58, 28, 113], [215, 109, 119]], 
    [[255, 126, 95], [254, 180, 123]], [[0, 201, 255], [146, 254, 157]],
    [[191, 105, 105], [194, 112, 66]], [[163, 135, 185], [170, 107, 115]],
    [[228, 163, 127], [191, 105, 105]], [[170, 107, 115], [194, 112, 66]],
    [[5, 117, 230], [2, 27, 121]], [[255, 75, 31], [255, 144, 104]],
    [[0, 210, 255], [58, 123, 213]], [[247, 151, 30], [255, 210, 0]],
    [[19, 78, 94], [113, 178, 128]], [[195, 20, 50], [36, 11, 54]],
    [[17, 153, 142], [56, 239, 125]], [[168, 192, 255], [63, 75, 150]] // from image 
  ];
  const [c1, c2] = palettes[Math.floor(Math.random() * palettes.length)];
  const angle = Math.floor(Math.random() * 360);
  return `linear-gradient(${angle}deg, rgba(${c1[0]},${c1[1]},${c1[2]},${alpha}) 0%, rgba(${c2[0]},${c2[1]},${c2[2]},${alpha}) 100%)`;
};

const WidgetSettings = ({ 
  isModal = false, 
  isEmbedded = false,
  onClose, 
  initialTab = "connexion",
  isClient,
  getCachedGradient,
  mouchardLogs,
  activePhase,
  availableProjects,
  setAvailableProjects,
  selectedLaunchProject,
  setSelectedLaunchProject,
  isMobileNative
}: any) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Si l'initialTab change (via l'event open-mouchard), on met à jour
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // États locaux
  const [execMode, setExecMode] = useState("web");
  const [targetAi, setTargetAi] = useState("deepseek");
  const [targetUiAi, setTargetUiAi] = useState("stitch");
  const [customAiName, setCustomAiName] = useState("");
  const [customAiUrl, setCustomAiUrl] = useState("");
  const [bridgeUrl, setBridgeUrl] = useState("http://127.0.0.1:5005");
  const [vercelUrl, setVercelUrl] = useState("https://v0-reponse-git-main-v01-e951.vercel.app");
  const [defaultPreviewUrl, setDefaultPreviewUrl] = useState("http://127.0.0.1:5173");
  const [apiKey, setApiKey] = useState("");
  const [overridePrompt, setOverridePrompt] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [isExtConnected, setIsExtConnected] = useState(true);

  useEffect(() => {
    setExecMode(localStorage.getItem("tiger_execMode") || "web");
    setTargetAi(localStorage.getItem("tiger_targetAi") || "deepseek");
    setTargetUiAi(localStorage.getItem("tiger_targetUiAi") || "stitch");
    setCustomAiName(localStorage.getItem("tiger_customAiName") || "");
    setCustomAiUrl(localStorage.getItem("tiger_customAiUrl") || "");
    setBridgeUrl(localStorage.getItem("tiger_bridgeUrl") || "http://127.0.0.1:5005");
    setVercelUrl(localStorage.getItem("tiger_vercelUrl") || "https://v0-reponse-git-main-v01-e951.vercel.app");
    setDefaultPreviewUrl(localStorage.getItem("tiger_defaultPreviewUrl") || "http://127.0.0.1:5173");
    setApiKey(localStorage.getItem("tiger_apiKey") || "");
  }, []);

  const handleSave = () => {
    const settings = { execMode, targetAi, targetUiAi, customAiName, customAiUrl, bridgeUrl, vercelUrl, defaultPreviewUrl, apiKey };
    
    localStorage.setItem("tiger_execMode", execMode);
    localStorage.setItem("tiger_targetAi", targetAi);
    localStorage.setItem("tiger_targetUiAi", targetUiAi);
    localStorage.setItem("tiger_customAiName", customAiName);
    localStorage.setItem("tiger_customAiUrl", customAiUrl);
    localStorage.setItem("tiger_bridgeUrl", bridgeUrl);
    localStorage.setItem("tiger_vercelUrl", vercelUrl);
    localStorage.setItem("tiger_defaultPreviewUrl", defaultPreviewUrl);
    localStorage.setItem("tiger_apiKey", apiKey);
    
    if (typeof window !== "undefined" && (window as any).AndroidBridge && (window as any).AndroidBridge.showToast) {
      (window as any).AndroidBridge.showToast("Paramètres synchronisés !");
    }
    if (typeof window !== "undefined") {
      window.postMessage({ type: 'TIGER_EXTENSION_SYNC', payload: settings }, '*');
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'TIGER_EXTENSION_SYNC', payload: settings }, '*');
      }
    }
    
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const tabs = [
    { id: "home", label: "TIGER IA", icon: "🐯" },
    { id: "electron", label: "Electron", icon: "💻" },
    { id: "vercel", label: "Vercel", icon: "▲" },
    { id: "deepseek", label: "DeepSeek", icon: "🐋" },
    { id: "pipeline", label: "Pipeline", icon: "🎯" },
    { id: "override", label: "Override", icon: "💉" },
    { id: "mouchard", label: "Mouchard", icon: "👁️" },
    { id: "connexion", label: "Connexion", icon: "⚙️" },
  ];

  return (
    <div className={`w-full h-screen bg-gradient-to-br from-[#845e7c]/95 to-[#6c3050]/95 backdrop-blur-2xl border-none shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col md:flex-row pointer-events-auto`}>
      
      {/* Sidebar */}
      {!isEmbedded && (
        <div className="w-full md:w-64 bg-gradient-to-b from-black/40 to-black/60 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-black text-white tracking-wider flex items-center gap-2">
            <span className="text-cyan">🐯</span> SETTINGS
          </h3>
          {isModal && (
            <button onClick={onClose} className="md:hidden w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 font-bold hover:bg-red-500 hover:text-white transition-colors">✕</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar flex md:flex-col gap-1 px-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal ${activeTab === t.id ? 'bg-cyan/20 border border-cyan/50 text-white shadow-[0_0_10px_rgba(8,179,201,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="font-bold text-sm tracking-wide">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Content Area */}
      <div className="flex-1 bg-gradient-to-br from-[#111111] to-black relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10 hide-scrollbar">
          
          {/* TABS CONTENT */}
          
          {activeTab === "connexion" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">Configuration LLM & Bridge</h2>
              
              <div>
                <label className="text-gray-300 font-bold mb-2 block uppercase tracking-wider text-[10px]">Mode d'exécution</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "web", icon: "💬", title: "Chat Web" },
                    { id: "api", icon: "🔑", title: "API Directe" },
                    { id: "hybrid", icon: "🔀", title: "Hybride" }
                  ].map(m => (
                    <button 
                      key={m.id} onClick={() => setExecMode(m.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${execMode === m.id ? 'bg-gradient-to-br from-cyan/20 to-cyan/10 border-cyan text-white shadow-[0_0_10px_rgba(8,179,201,0.3)]' : 'bg-gradient-to-br from-black/30 to-black/50 border-white/10 text-gray-500 hover:border-white/30'}`}
                    >
                      <span className="text-2xl mb-1">{m.icon}</span>
                      <span className="font-bold text-xs">{m.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(execMode === "web" || execMode === "hybrid") && (
                <div className="space-y-3">
                  <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">Flotte d'Assistants (Multi-Acteurs)</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Acteur Logique */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-4 rounded-xl border border-white/10 hover:border-cyan/50 transition-colors">
                      <div className="text-[10px] text-cyan mb-2 font-bold flex items-center gap-2">🧠 Cerveau Logique (Backend)</div>
                      <div className="flex gap-2">
                        <select 
                          value={targetAi} onChange={(e) => setTargetAi(e.target.value)}
                          className="flex-1 bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-cyan text-sm"
                        >
                          <option value="deepseek">🐋 DeepSeek Web</option>
                          <option value="chatgpt">🟢 ChatGPT Web</option>
                          <option value="gemini">✨ Gemini Web</option>
                          <option value="claude">🟣 Claude Web</option>
                          <option value="kimi">🌙 Kimi Web</option>
                          <option value="qwen">🌐 Qwen Coder</option>
                          <option value="custom">➕ IA Personnalisée</option>
                        </select>
                        <button 
                          onClick={() => {
                            if (typeof window !== "undefined" && (window as any).AndroidBridge) {
                              const url = targetAi === "custom" ? customAiUrl : `https://chat.${targetAi}.com/`;
                              (window as any).AndroidBridge.openAIWithPrompt(url, "Initialisation Logique.");
                            }
                          }}
                          className="px-3 bg-white/10 hover:bg-cyan/20 rounded-lg font-bold text-xs transition-colors text-white"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    {/* Acteur UI */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-4 rounded-xl border border-white/10 hover:border-pink/50 transition-colors">
                      <div className="text-[10px] text-pink mb-2 font-bold flex items-center gap-2">🎨 Cerveau UI/UX (Frontend)</div>
                      <div className="flex gap-2">
                        <select 
                          value={targetUiAi} onChange={(e) => setTargetUiAi(e.target.value)}
                          className="flex-1 bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-pink text-sm"
                        >
                          <option value="stitch">🧵 Stitch Google</option>
                          <option value="v0">▲ v0.dev (Vercel)</option>
                          <option value="bolt">⚡ Bolt.new</option>
                          <option value="custom">➕ UI Personnalisée</option>
                        </select>
                        <button 
                          onClick={() => {
                            if (typeof window !== "undefined" && (window as any).AndroidBridge) {
                              const url = targetUiAi === "custom" ? customAiUrl : targetUiAi === "v0" ? "https://v0.dev/" : "https://stitch.withgoogle.com/";
                              (window as any).AndroidBridge.openAIWithPrompt(url, "Initialisation Design.");
                            }
                          }}
                          className="px-3 bg-white/10 hover:bg-pink/20 rounded-lg font-bold text-xs transition-colors text-white"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
                
              {(targetAi === "custom" || targetUiAi === "custom") && (
                  <div className="flex gap-3 bg-white/5 border border-white/20 p-3 rounded-xl mt-2 animate-fadeIn">
                    <div className="flex-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Nom IA Custom</label>
                      <input type="text" value={customAiName} onChange={(e) => setCustomAiName(e.target.value)} placeholder="Mon Agent" className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-white/50" />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">URL Complète</label>
                      <input type="text" value={customAiUrl} onChange={(e) => setCustomAiUrl(e.target.value)} placeholder="https://..." className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-white/50 font-mono" />
                    </div>
                  </div>
                )}

              {(execMode === "api" || execMode === "hybrid") && (
                <>
                  <div className="space-y-2">
                    <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">Fournisseur API</label>
                    <select className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-pink text-sm">
                      <option value="deepseek">🐋 DeepSeek</option>
                      <option value="openai">🟢 OpenAI (ChatGPT)</option>
                      <option value="gemini">✨ Google Gemini</option>
                      <option value="claude">🟣 Anthropic Claude</option>
                      <option value="kimi">🌙 Moonshot Kimi</option>
                      <option value="qwen">🌐 Alibaba Qwen</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">Clé API DeepSeek</label>
                    <div className="flex gap-2 relative">
                      <input 
                        type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="flex-1 bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-pink text-sm font-mono"
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">👁</button>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={handleSave} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider transition-colors">
                        💾 SAUVEGARDER_CONFIG
                      </button>
                      <span className="text-gray-500 text-xs italic">Clé stockée localement dans le navigateur.</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-gradient-to-br from-black/30 to-black/50 border border-white/5 rounded-xl">
                    <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">Modèle détecté</label>
                    <div className="text-gray-500 text-sm mb-2">Enregistrer la clé pour détecter</div>
                    <div className="flex items-center gap-4">
                      <button className="px-4 py-2 bg-pink/20 text-pink border border-pink/50 hover:bg-pink/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
                        🔄 AUTO_DETECT
                      </button>
                      <span className="text-gray-500 text-xs italic">Auto-détecté à l'enregistrement.</span>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION BRIDGE PC vs MOBILE NATIF */}
              <div className="pt-4 border-t border-white/10">
                {isMobileNative ? (
                  <div className="space-y-4">
                    <h3 className="text-cyan font-bold flex items-center gap-2 text-sm mb-2">
                      📱 Moteur Mobile Natif
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Connecté</span>
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      La configuration automatique est active. Les prompts sont injectés via la WebView Fantôme Java et les fichiers sont sauvegardés nativement sur votre téléphone.
                      <br /><br />
                      <strong>Aucun Bridge Electron PC n'est requis.</strong> L'OS Souverain est 100% autonome dans votre poche.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-cyan font-bold flex items-center gap-2 text-sm mb-4">
                      🔗 Bridge (:5005 / Vercel)
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Bridge polling actif</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">URL Bridge local</label>
                        <input type="text" value={bridgeUrl} onChange={(e) => setBridgeUrl(e.target.value)} className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-mono mt-1" />
                      </div>
                      <div>
                        <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">URL Vercel</label>
                        <input type="text" value={vercelUrl} onChange={(e) => setVercelUrl(e.target.value)} className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-mono mt-1" />
                      </div>
                      <div>
                        <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">URL Preview par défaut</label>
                        <input type="text" value={defaultPreviewUrl} onChange={(e) => setDefaultPreviewUrl(e.target.value)} placeholder="http://127.0.0.1:3000" className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-sm font-mono mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">🔗 Tester</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-cyan/20 hover:bg-cyan/40 text-cyan rounded-lg text-xs font-bold uppercase transition-colors">💾 SAUVEGARDER_CONFIG</button>
                    </div>
                    <div className="text-green-400 text-xs font-bold mt-4 flex items-center gap-2">✅ Bridge connecté (auto-détecté)</div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "pipeline" && (
            <div className="space-y-4 animate-fadeIn h-full flex flex-col">
              <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">MISSION ACTIVE</h2>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-gradient-to-br from-cyan/30 to-cyan/10 border border-cyan/50 p-2 rounded-lg cursor-pointer hover:from-cyan/40 hover:to-cyan/20 transition-colors">
                  <div className="text-white font-bold text-xs flex items-center gap-2">⚙️ Standard G5</div>
                  <div className="text-[10px] text-cyan mt-1 leading-tight">Génération de A à Z (Architecture, Design, Logique).</div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-pink/30 to-pink/10 border border-pink/50 p-2 rounded-lg cursor-pointer hover:from-pink/40 hover:to-pink/20 transition-colors">
                  <div className="text-white font-bold text-xs flex items-center gap-2">🎨 Design-First</div>
                  <div className="text-[10px] text-pink mt-1 leading-tight">Stitch UI d'abord → L'IA câble la logique ensuite.</div>
                </div>
              </div>

              <div className="text-yellow-400 text-sm font-bold mt-2">— IDE Autonome (Kirov5) —</div>
              
              <div className="mt-2 mb-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch("http://localhost:5005/api/projects");
                        const data = await res.json();
                        if (data.projects) {
                          setAvailableProjects(data.projects);
                          if (data.projects.length > 0 && !selectedLaunchProject) {
                            setSelectedLaunchProject(data.projects[0]);
                          }
                        }
                      } catch (e) {
                        alert("Impossible de charger les projets. Le Bridge est-il allumé ?");
                      }
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors"
                  >
                    🔄
                  </button>
                  <select 
                    value={selectedLaunchProject}
                    onChange={(e) => setSelectedLaunchProject(e.target.value)}
                    className="flex-1 bg-black/50 text-white border border-cyan/30 rounded-lg px-2 py-1 outline-none focus:border-cyan text-xs"
                  >
                    <option value="">-- Sélectionnez un projet --</option>
                    {availableProjects.map((p: string) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg text-white font-bold text-xs" style={{ backgroundImage: 'linear-gradient(to right, #10a37f, #0d8a6a)', borderColor: '#10a37f' }}>
                    📦 Auto-Capture
                  </button>
                  <button 
                    onClick={async () => {
                      if (!selectedLaunchProject) return alert("Veuillez sélectionner un projet d'abord !");
                      try {
                        const res = await fetch("http://localhost:5005/api/bridge/launch-project", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ project_id: selectedLaunchProject })
                        });
                        const data = await res.json();
                        alert(data.message || "Lancement en cours...");
                      } catch (e: any) {
                        alert("Erreur de connexion au Moteur Electron : " + e.message);
                      }
                    }}
                    className="flex-1 py-2 rounded-lg text-black font-bold text-xs bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/80 hover:to-blue-500/80 transition-colors"
                  >
                    🚀 Lancer l'Aperçu
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                {["Enrichment", "Intent", "WBS", "Architecture", "Design", "Génération", "Testing", "Déverrouillage", "Transition", "Mission", "Évolution"].map((phase, idx) => {
                  const isCurrent = activePhase === (idx + 1);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded border ${isCurrent ? 'bg-gradient-to-r from-cyan/30 to-cyan/10 border-cyan text-white shadow-[0_0_10px_rgba(8,179,201,0.2)]' : 'bg-gradient-to-r from-black/30 to-black/10 border-white/5 opacity-60'}`}>
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-gradient-to-br from-cyan to-blue-500 text-black' : 'bg-gradient-to-br from-white/20 to-white/5'}`}>{idx}</div>
                      <span className="text-sm font-medium">{phase}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-2 bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-xl p-3 font-mono text-[10px] text-green-400 flex-1 min-h-[150px] overflow-y-auto flex flex-col-reverse">
                <div>
                  {mouchardLogs.map((log: string, idx: number) => (
                    <div key={idx} className="mb-1 opacity-90 break-all">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "override" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-white border-b border-white/10 pb-2">Mode Manuel (Override)</h2>
                <p className="text-gray-400 text-xs mt-2">Prenez le contrôle manuel si l'automatisation s'enraye.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-gray-300 font-bold text-sm">Injection de prompt de secours</label>
                <textarea 
                  value={overridePrompt} onChange={(e) => setOverridePrompt(e.target.value)}
                  placeholder="Entrez le prompt à forcer dans DeepSeek..."
                  className="w-full h-32 bg-gradient-to-b from-gray-900/60 to-black/60 text-white border border-white/20 rounded-xl p-3 outline-none focus:border-cyan text-sm resize-none"
                />
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 py-2 bg-gradient-to-r from-pink/30 to-pink/10 hover:from-pink/40 hover:to-pink/20 text-pink border border-pink/50 rounded-lg text-xs font-bold transition-all">💉 Forcer Injection</button>
                  <button className="flex-1 py-2 bg-gradient-to-r from-orange-500/30 to-orange-500/10 hover:from-orange-500/40 hover:to-orange-500/20 text-orange-400 border border-orange-500/50 rounded-lg text-xs font-bold transition-all">📦 Forcer Capture</button>
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-black/50 to-black/70 border border-white/10 p-3 rounded-xl h-32 font-mono text-[10px] text-gray-400 overflow-y-auto">
                <span className="text-white mb-2 block">Log Override</span>
                En attente d'action manuelle...
              </div>
            </div>
          )}

          {activeTab === "mouchard" && (
            <div className="space-y-4 animate-fadeIn h-full flex flex-col">
              <div>
                <h2 className="text-xl font-black text-white border-b border-white/10 pb-2">Mouchard Système</h2>
                <p className="text-gray-400 text-xs mt-2">Surveillance en temps réel du flux de données.</p>
              </div>
              
              <div className="flex-1 bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-2 relative">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button className="text-[10px] bg-gradient-to-r from-red-500/30 to-red-500/10 text-red-400 px-2 py-1 rounded hover:from-red-500/40 hover:to-red-500/20">[WIPE]</button>
                </div>
                <div className="text-white font-bold mb-3 border-b border-white/20 pb-1 inline-block">LOG_STREAM</div>
                
                <div className="text-yellow-400">[09:24:30] ⚠️ Bridge local non joignable (Failed to fetch (Bridge hors ligne) - Failed to fetch). Polling Vercel actif.</div>
                <div className="text-green-400">[09:24:30] KIROV5 Orchestrator v5.1.1 prêt — structure React (.tsx/.ts/.css) préservée.</div>
                <div className="text-cyan">[09:24:30] Onglets: Projets · Projet · Injection · Capture · GitHub + Bridge :5005.</div>
              </div>
            </div>
          )}

          {["home", "electron", "vercel", "deepseek"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fadeIn opacity-50">
              <span className="text-6xl">{tabs.find(t => t.id === activeTab)?.icon}</span>
              <h3 className="text-xl font-bold text-white">Module {tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-400">Section technique héritée du cœur Kirov5.</p>
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        {!isEmbedded && (
        <div className="p-4 border-t border-white/10 bg-gradient-to-b from-black/30 to-black/50 flex flex-wrap justify-between items-center gap-4 relative z-10">
          <button 
            onClick={() => setIsExtConnected(!isExtConnected)}
            className={`text-xs font-bold hover:underline flex items-center gap-1 ${isExtConnected ? 'text-green-500' : 'text-red-500'}`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${isExtConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isExtConnected ? 'Extension Connectée' : 'Extension Déconnectée'}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {savedMsg && <span className="text-green-400 font-bold text-xs flex items-center mr-2 animate-pulse">✓ Sauvegardé</span>}
            {isModal && (
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-white font-bold bg-gradient-to-r from-white/10 to-transparent hover:from-white/20 transition-colors text-sm">
                Fermer
              </button>
            )}
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan to-blue-500 rounded-xl text-black font-black uppercase tracking-wider transition-all text-sm shadow-[0_0_15px_rgba(8,179,201,0.5)] whitespace-nowrap"
            >
              💾 SAUVER
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const gradientCache = useRef<{ [key: string]: string }>({});
  const getCachedGradient = (key: string, alpha = 1) => {
    if (typeof window === 'undefined') return `linear-gradient(135deg, rgba(17,17,17,${alpha}), rgba(34,34,34,${alpha}))`;
    if (!gradientCache.current[key]) {
      gradientCache.current[key] = getRandomGradient(alpha);
    }
    return gradientCache.current[key];
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Système Tiger IA initialisé. L'interface unique est active. Que souhaitez-vous faire ?",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Simulation des phases de création
  const [activePhase, setActivePhase] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isMobileNative, setIsMobileNative] = useState(false);

  useEffect(() => {
    // Détection agressive de l'environnement Mobile (Boucle de vérification)
    let attempts = 0;
    const checkMobile = setInterval(() => {
      if (typeof window !== "undefined") {
        const hasCapacitor = (window as any).Capacitor?.isNativePlatform?.();
        const hasAndroidBridge = !!(window as any).AndroidBridge;
        if (hasCapacitor || hasAndroidBridge) {
          setIsMobileNative(true);
          clearInterval(checkMobile);
        }
      }
      if (attempts++ > 10) clearInterval(checkMobile); // Arrêt après 1 seconde
    }, 100);
    return () => clearInterval(checkMobile);
  }, []);

  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [selectedLaunchProject, setSelectedLaunchProject] = useState<string>("");
  const [mouchardLogs, setMouchardLogs] = useState<string[]>(["> Système Kirov5 initialisé."]);
  const [realProjects, setRealProjects] = useState<{name: string, desc: string, bg: string}[]>([]);

  // --- NOUVEAUX ETATS : IDE & TROMBONE ---
  const [isPrdModalOpen, setIsPrdModalOpen] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  
  // MODAL NOUVEAU PROJET V0 -> CREATION MODE INLINE
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStack, setNewProjectStack] = useState("Vite + React + Tailwind + TS");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectLogicAi, setNewProjectLogicAi] = useState("deepseek");
  const [newProjectInstructions, setNewProjectInstructions] = useState("");
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);

  const togglePack = (packId: string) => {
    setSelectedPacks(prev => prev.includes(packId) ? prev.filter(id => id !== packId) : [...prev, packId]);
  };
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [fsTree, setFsTree] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [tromboneFiles, setTromboneFiles] = useState<{path: string, content: string}[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewInput, setPreviewInput] = useState<string>("");
  const [isIdeFullscreen, setIsIdeFullscreen] = useState(false);
  const lastPreviewUrlRef = useRef<string | null>(null);
  
  useEffect(() => {
    lastPreviewUrlRef.current = null;
    setPreviewUrl(null);
    if (activeProject) {
      setIsIdeFullscreen(true);
    } else {
      setIsIdeFullscreen(false);
    }
  }, [activeProject]);

  // Chargement de l'arborescence quand un projet est actif
  useEffect(() => {
    if (activeProject) {
      fetch(`http://localhost:5005/api/fs/tree?project=${activeProject}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFsTree(data.tree);
        }).catch(() => {});
    }
  }, [activeProject]);

  // Chargement du contenu du fichier sélectionné
  useEffect(() => {
    if (activeProject && activeFile) {
      fetch(`http://localhost:5005/api/fs/read?project=${activeProject}&file=${encodeURIComponent(activeFile)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFileContent(data.content);
        }).catch(() => {});
    }
  }, [activeProject, activeFile]);

  // Sauvegarde manuelle du fichier (Hybride PC / Mobile)
  const handleSaveFile = async (content: string | undefined) => {
    if (content === undefined || !activeProject || !activeFile) return;
    setFileContent(content);
    
    // Détection Mobile Blindée
    const isMobileNative = Capacitor.isNativePlatform() || !!(window as any).AndroidBridge;

    if (isMobileNative) {
      // 📱 MOTEUR NATIF ANDROID
      try {
        await Filesystem.writeFile({
          path: `v0-moteur-mobile/projetv0/${activeProject}/${activeFile}`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true
        });
      } catch (e) {
        console.error("Erreur de sauvegarde mobile:", e);
      }
    } else {
      // 💻 MOTEUR ELECTRON (PC)
      fetch("http://localhost:5005/api/fs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: activeProject, file: activeFile, content })
      }).catch(() => {});
    }
  };

  // Attacher au trombone
  const attachToTrombone = (filePath: string) => {
    if (!activeProject) return;
    fetch(`http://localhost:5005/api/fs/read?project=${activeProject}&file=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTromboneFiles(prev => {
            if (prev.find(f => f.path === filePath)) return prev;
            return [...prev, { path: filePath, content: data.content }];
          });
        }
      }).catch(() => {});
  };

  // Chargement des projets réels au montage (Hybride)
  useEffect(() => {
    const loadProjects = async () => {
      const cardStyles = [
        "bg-gradient-to-br from-[#bf6969]/80 to-[#c27042]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#a387b9]/80 to-[#aa6b73]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#e4a37f]/80 to-[#bf6969]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#aa6b73]/80 to-[#c27042]/90 backdrop-blur-md"
      ];

      // Détection Mobile Blindée (Vérifie Capacitor OU la présence de la WebView Fantôme Java)
      const isMobileNative = Capacitor.isNativePlatform() || !!(window as any).AndroidBridge;

      if (isMobileNative) {
        try {
          const result = await Filesystem.readdir({
            path: 'v0-moteur-mobile/projetv0',
            directory: Directory.Documents
          });
          // Capacitor 6 returns an array of FileInfo in result.files
          const projectNames = result.files.map(f => f.name || (f as any).toString());
          setRealProjects(projectNames.map((p: string, i: number) => ({
            name: p,
            desc: "Mémoire Téléphone",
            bg: cardStyles[i % cardStyles.length]
          })));
        } catch (e) {
          console.log("Aucun projet mobile trouvé ou dossier inexistant.");
        }
      } else {
        fetch("http://localhost:5005/api/projects")
          .then(res => res.json())
          .then(data => {
            if (data.success && data.projects) {
              setRealProjects(data.projects.map((p: string, i: number) => ({
                name: p,
                desc: "Environnement Local",
                bg: cardStyles[i % cardStyles.length]
              })));
            }
          }).catch(() => {});
      }
    };
    loadProjects();
  }, []);

  // Chargement de l'historique
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOpenMouchard = () => setIsRightSidebarOpen(true);
    window.addEventListener('open-mouchard', handleOpenMouchard);

    // Écouteur pour le Moteur Mobile (WebView Fantôme Java)
    const handleNativeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TIGER_CAPTURE') {
        const extractedCode = event.data.data;
        if (extractedCode) {
          // Détection automatique du nom de fichier
          let fileName = "index.html";
          if (extractedCode.includes("import React") || extractedCode.includes("export default")) fileName = "App.tsx";
          if (extractedCode.includes("tailwindcss")) fileName = "index.css";
          
          setActiveFile(fileName);
          handleSaveFile(extractedCode);

          // MISE A JOUR DYNAMIQUE VISUELLE DE L'ARBORESCENCE !
          setFsTree((prev: any) => {
            const newFileNode = { name: fileName, path: fileName, type: 'file' };
            if (!prev) return { name: "Mobile_Storage", type: 'directory', children: [newFileNode] };
            
            const exists = prev.children?.find((c: any) => c.name === fileName);
            if (!exists) return { ...prev, children: [...(prev.children || []), newFileNode] };
            return prev;
          });
        }
      }
    };
    window.addEventListener('message', handleNativeMessage);

    return () => {
      window.removeEventListener('open-mouchard', handleOpenMouchard);
      window.removeEventListener('message', handleNativeMessage);
    };
  }, [activeProject, activeFile]);

  // Polling des logs du Mouchard (Bridge Electron)
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      fetch("http://localhost:5005/api/bridge/logs")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.logs) {
            setMouchardLogs(data.logs);
            const serverReadyLog = data.logs.find((log: string) => log.includes("URL_PREVIEW="));
            if (serverReadyLog) {
                const url = serverReadyLog.split('URL_PREVIEW=')[1];
                
                if (url !== lastPreviewUrlRef.current) {
                    lastPreviewUrlRef.current = url;
                    setPreviewUrl(url);
                    setPreviewInput(url);
                }
            }
          }
        })
        .catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (overrideText?: any) => {
    // Si overrideText est un événement (ex: depuis onClick ou onKeyDown), on l'ignore.
    const textToSend = (typeof overrideText === 'string') ? overrideText : input;
    
    if (!textToSend.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    
    const lowerInput = textToSend.toLowerCase();
    
    setTimeout(() => {
      let responseMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };

      const normalizedInput = lowerInput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // 0. DÉTECTION LISTE DES PROJETS (Doit passer AVANT la création)
      if (normalizedInput === "mes projets" || normalizedInput.includes("liste des projet") || normalizedInput === "projet" || normalizedInput === "projets") {
        responseMsg.content = "Voici la liste de vos projets récents :";
        responseMsg.widget = "projects";
      }
      // 1. DÉTECTION MODIFICATION (Projet Existant / Reprise)
      else if ((normalizedInput.includes("stitch") || normalizedInput.includes("deepseek") || normalizedInput.includes("design") || normalizedInput.includes("logique")) && 
          (normalizedInput.includes("modifi") || normalizedInput.includes("ajoute") || normalizedInput.includes("change") || normalizedInput.includes("mise a jour") || normalizedInput.includes("evolue") || normalizedInput.includes("reprends") || normalizedInput.includes("continue"))) {
        
        // Extraction du nom de projet si fourni entre crochets (ex: [Portfolio React Vite])
        const projectMatch = textToSend.match(/\[(.*?)\]/);
        const targetProject = projectMatch ? projectMatch[1] : null;
        const targetAi = normalizedInput.includes("deepseek") ? "deepseek" : "stitch";

        responseMsg.content = `🔄 MODE ÉVOLUTION ACTIVÉ (${targetAi.toUpperCase()}) 🔄\n\nJ'injecte vos nouvelles directives directement dans votre interface... ${targetProject ? `\n🔍 Recherche et AutoSwitch vers le projet : "${targetProject}"` : "Reprise du travail en cours."}`;
        responseMsg.widget = null;

        // On envoie le prompt directement au Bridge local sans ouvrir de nouvel onglet
        fetch("http://localhost:5005/bridge/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_ai: targetAi,
            target_project: targetProject, // L'extension fera le switch automatiquement !
            prompt: "Mise à jour (Reprise de projet) : " + textToSend.replace(/\[.*?\]/, "").trim(),
            auto_submit: true
          })
        }).catch(err => console.log("Erreur de connexion au Bridge local pour l'injection", err));
        
      } 
      // 2. DÉTECTION NOUVEAU PROJET (PIPELINE COMPLET)
      else if (normalizedInput.includes("cree") || normalizedInput.includes("lance") || normalizedInput.includes("projet") || normalizedInput.includes("generation")) {
        responseMsg.content = "🚀 DÉMARRAGE PARALLÈLE KIROV5 🚀\n\n1️⃣ [UI/UX] Ouverture de l'assistant Design avec le prompt UI enrichi...\n2️⃣ [LOGIQUE] Préparation de l'assistant Logique et création du dossier projet local...\n\nLes intelligences artificielles sont informées et en attente. Une fois le design terminé, glissez l'HTML ici pour lancer le câblage final en phase 5.";
        responseMsg.widget = "phases";
        
        setActivePhase(1);
        
        // Création du nom de projet et ouverture dynamique de l'arborescence à gauche !
        const newProjectId = "Projet_" + textToSend.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
        setActiveProject(newProjectId);
        if (typeof window !== 'undefined') localStorage.setItem("tiger_lastGeneratedProject", newProjectId);
        
        if (typeof window !== "undefined") {
          const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
          const uiAi = localStorage.getItem("tiger_targetUiAi") || "stitch";
          
          const getUrl = (id: string, isUi: boolean = false) => {
            if (id === "custom") return localStorage.getItem("tiger_customAiUrl") || "https://chat.deepseek.com/";
            if (id === "stitch") return "https://stitch.withgoogle.com/";
            if (id === "v0") return "https://v0.dev/";
            return `https://chat.${id}.com/`;
          };

          // Lancement réel via le Bridge Android (WebView Fantôme) ou Electron
          const bridge = (window as any).AndroidBridge;
          if (bridge && bridge.openAIWithPrompt) {
            // 📱 MOTEUR MOBILE : On lance Stitch d'abord. DeepSeek sera lancé après le Trombone.
            bridge.openAIWithPrompt(getUrl(uiAi, true), "Génère l'interface UI/UX complète et moderne pour ce projet : " + textToSend);
            if (bridge.showToast) bridge.showToast("Stitch s'ouvre. Générez le HTML, puis utilisez le Trombone.");
          } else {
            // 💻 MOTEUR PC : Fallback pour navigateur standard / Electron (Multifenêtrage)
            // On envoie le prompt UI au Bridge
            const sendUiPrompt = () => {
              if (selectedPacks && selectedPacks.length > 0) {
                return fetch("http://localhost:5005/api/bridge/trombone", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: uiAi,
                    user_prompt: "Génère l'interface UI/UX complète et moderne pour ce projet : " + textToSend,
                    packs: selectedPacks,
                    target_project: newProjectId
                  })
                });
              } else {
                return fetch("http://localhost:5005/bridge/prompt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: uiAi,
                    prompt: "Génère l'interface UI/UX complète et moderne pour ce projet : " + textToSend,
                    auto_submit: true,
                    project_id: newProjectId,
                    phase_num: 1
                  })
                });
              }
            };

            sendUiPrompt().then(() => {
              console.log("Prompt UI envoyé au Bridge");
              window.open(getUrl(uiAi, true), "_blank");
            }).catch(() => {
              window.open(getUrl(uiAi, true), "_blank");
            });

            // On envoie le prompt Logique au Bridge avec un léger décalage réseau (pas visuel)
            setTimeout(() => {
              if (selectedPacks && selectedPacks.length > 0) {
                // TROMBONE PIPELINE (PRD)
                fetch("http://localhost:5005/api/bridge/trombone", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: logicAi,
                    user_prompt: textToSend,
                    packs: selectedPacks,
                    target_project: newProjectId
                  })
                }).then(() => {
                  console.log("Méga-Prompt Trombone envoyé !");
                  window.open(getUrl(logicAi), "_blank");
                }).catch(err => {
                  console.log("Erreur Trombone Bridge:", err);
                  window.open(getUrl(logicAi), "_blank");
                });
              } else {
                // STANDARD PIPELINE
                fetch("http://localhost:5005/bridge/prompt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: logicAi,
                    prompt: "L'interface UI/UX est actuellement en cours de génération. Prépare la structure backend et les états React pour un projet complexe : " + textToSend + ". Reste en attente, je te fournirai le fichier HTML pour le câblage final.",
                    auto_submit: true,
                    project_id: newProjectId,
                    phase_num: 1
                  })
                }).then(() => {
                  console.log("Prompt Logique envoyé au Bridge");
                  window.open(getUrl(logicAi), "_blank");
                }).catch(() => {
                  window.open(getUrl(logicAi), "_blank");
                });
              }
            }, 500); 
              
            console.log("Les IA ont été ouvertes. Les prompts ont été envoyés au Bridge local pour injection via l'extension.");
          }
        }

        // 3. Simulation visuelle des phases
        setActivePhase(1);
        let current = 1;
        const interval = setInterval(() => {
          current++;
          if (current > 11) {
            clearInterval(interval);
          } else {
            setActivePhase(current);
          }
        }, 1500);

      } else if (normalizedInput.includes("youtube") || normalizedInput.includes("video")) {
        responseMsg.content = "Voici les résultats YouTube pour votre recherche :";
        responseMsg.widget = "youtube";
      } else if (normalizedInput.includes("actualite") || normalizedInput.includes("ia") || normalizedInput.includes("news")) {
        responseMsg.content = "Voici les dernières actualités sur l'Intelligence Artificielle :";
        responseMsg.widget = "news";
      } else if (normalizedInput.includes("parametre") || normalizedInput.includes("reglage") || normalizedInput.includes("configuration") || normalizedInput.includes("setting")) {
        responseMsg.content = "Ouverture du panneau de configuration système :";
        responseMsg.widget = "settings";

      } else {
        responseMsg.content = "Traitement de votre demande via Tiger IA...";
        // Call bridge if available, otherwise window.open
        if (typeof window !== "undefined") {
          const bridge = (window as any).AndroidBridge;
          if (bridge && bridge.openAIWithPrompt) {
            bridge.openAIWithPrompt("https://chat.deepseek.com/", textToSend);
          } else {
            window.open("https://chat.deepseek.com/", "_blank");
          }
        }
      }

      setMessages((prev) => [...prev, responseMsg]);
    }, 600);

    setInput("");
  };

  const handleStartNewV0Project = () => {
    if (!newProjectName.trim()) return alert("Veuillez donner un nom à votre projet");
    
    setIsCreationMode(false);
    localStorage.setItem("tiger_targetAi", newProjectLogicAi);
    
    const promptText = `Génère l'interface UI/UX complète et moderne pour le projet : ${newProjectName}.
Stack / Structure : ${newProjectStack}.
Description : ${newProjectDesc}.`;

    const newProjectId = activeProject || ("Projet_" + newProjectName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4));
    
    if (!activeProject) {
      setActiveProject(newProjectId);
      // Création automatique si non validé manuellement (Astuce SOUVERAINE)
      fetch("http://localhost:5005/api/fs/write", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           project: newProjectId,
           file: "README.md",
           content: `# ${newProjectName}\n\nInitialisé par Tiger IA V0.\nStack : ${newProjectStack}\nDescription : ${newProjectDesc}`
         })
      }).catch(e => console.error("[IDE] Erreur création auto du dossier", e));
    }
    
    if (typeof window !== 'undefined') localStorage.setItem("tiger_lastGeneratedProject", newProjectId);
    
    const uiAi = localStorage.getItem("tiger_targetUiAi") || "stitch";
    const getUrl = (id: string, isUi: boolean = false) => {
      if (id === "custom") return localStorage.getItem("tiger_customAiUrl") || "https://chat.deepseek.com/";
      if (id === "stitch") return "https://stitch.withgoogle.com/";
      if (id === "v0") return "https://v0.dev/";
      return `https://chat.${id}.com/`;
    };

    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🚀 Lancement de la phase UI pour "${newProjectName}".\nL'assistant Logique (${newProjectLogicAi.toUpperCase()}) prendra le relais quand vous glisserez le fichier HTML final dans le chat.`,
      widget: "phases"
    };
    setActivePhase(1);
    setMessages(prev => [...prev, { id: Date.now().toString() + "_u", role: "user", content: `Nouveau projet : ${newProjectName}` }, msg]);

    const sendUiPrompt = () => {
      if (selectedPacks && selectedPacks.length > 0) {
        return fetch("http://localhost:5005/api/bridge/trombone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_ai: uiAi,
            user_prompt: promptText,
            packs: selectedPacks,
            target_project: newProjectId
          })
        });
      } else {
        return fetch("http://localhost:5005/bridge/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_ai: uiAi,
            prompt: promptText,
            auto_submit: true,
            project_id: newProjectId,
            phase_num: 1
          })
        });
      }
    };

    sendUiPrompt().then(() => {
      console.log("Prompt UI envoyé au Bridge");
      window.open(getUrl(uiAi, true), "_blank");
    }).catch(() => {
      window.open(getUrl(uiAi, true), "_blank");
    });
  };

  const handleFileUpload = async (files: FileList | File[] | File) => {
    let fileArray = Array.isArray(files) ? files : (files instanceof FileList ? Array.from(files) : [files]);
    
    // 1. Décompression des ZIP à la volée
    const zipFiles = fileArray.filter(f => f.name.endsWith('.zip'));
    let extractedFiles: File[] = [];
    
    if (zipFiles.length > 0) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString() + "_zip", 
        role: "user", 
        content: `📦 Extraction de l'archive ZIP en cours...` 
      }]);
      
      try {
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
        for (const zf of zipFiles) {
          const zip = new JSZip();
          const zipData = await zip.loadAsync(zf);
          
          for (const [filename, zipEntry] of Object.entries(zipData.files)) {
            // Ignorer les dossiers et fichiers cachés
            if (!zipEntry.dir && !filename.includes('__MACOSX') && !filename.split('/').pop()?.startsWith('.')) {
              const blob = await zipEntry.async("blob");
              const extFile = new File([blob], filename.split('/').pop() || filename, { type: blob.type });
              extractedFiles.push(extFile);
            }
          }
        }
      } catch (err) {
        console.error("Erreur décompression ZIP:", err);
        alert("Système Kirov5 : Impossible de lire l'archive ZIP.");
      }
    }
    
    // Remplacer les ZIP par leur contenu décompressé
    fileArray = [...fileArray.filter(f => !f.name.endsWith('.zip')), ...extractedFiles];

    // Separate HTML from other files
    const htmlFiles = fileArray.filter(f => f.name.endsWith('.html'));
    const otherFiles = fileArray.filter(f => !f.name.endsWith('.html') && (f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg') || f.name.endsWith('.md') || f.name.endsWith('.json') || f.name.endsWith('.txt')));

    if (htmlFiles.length === 0 && otherFiles.length === 0) {
      alert("Système Kirov5 : Format non supporté. Veuillez déposer au moins un .html, .md, .png, ou un .zip.");
      return;
    }

    let appendedToTrombone = [...tromboneFiles];

    // Process contextual files (.md, .png, etc.)
    for (const f of otherFiles) {
      const isImage = f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg');
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        if (isImage) reader.readAsDataURL(f);
        else reader.readAsText(f);
      });
      
      const newContext = { path: f.name, content: isImage ? `[Image jointe visuellement : ${f.name} (Binaire ignoré pour économie de tokens)]` : content };
      
      // Avoid duplicates
      if (!appendedToTrombone.some(ext => ext.path === f.name)) {
        appendedToTrombone.push(newContext);
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString() + "_" + Math.random(), 
        role: "user", 
        content: `📎 Fichier de contexte ajouté au Trombone : ${f.name}` 
      }]);
    }

    // Process HTML file
    if (htmlFiles.length > 0) {
      const mainHtml = htmlFiles[0];
      const htmlContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(mainHtml);
      });
      
      const newContext = { path: mainHtml.name, content: htmlContent };
      if (!appendedToTrombone.some(ext => ext.path === mainHtml.name)) {
        appendedToTrombone.push(newContext);
      }
      
      const uploadMsg: Message = { 
        id: Date.now().toString() + "_main", 
        role: "user", 
        content: `📁 Fichier de design déposé : ${mainHtml.name}\nAnalyse de la structure UI et assemblage du contexte en cours...` 
      };
      setMessages((prev) => [...prev, uploadMsg]);
    }

    // Add dummy zip representation for UI feedback
    const originalZipFiles = (Array.isArray(files) ? files : (files instanceof FileList ? Array.from(files) : [files])).filter(f => f.name.endsWith('.zip'));
    for (const zf of originalZipFiles) {
      if (!appendedToTrombone.some(ext => ext.path === zf.name)) {
        appendedToTrombone.push({ path: zf.name, content: "ZIP_ARCHIVE_DUMMY" });
      }
    }

    setTromboneFiles(appendedToTrombone);

    // If there is an HTML file, we trigger the build process
    if (htmlFiles.length > 0) {
      // NE PAS AUTO-LANCER SI ON EST EN MODE CREATION INLINE
      if (document.getElementById('creation-mode-container')) {
        return;
      }
      
      setTimeout(() => {
        // Pass the updated array explicitly to avoid stale closures during auto-start
        handleStartFullPipeline(appendedToTrombone);
      }, 1200);
    }
  };

  const handleStartFullPipeline = async (filesToUse: {path: string, content: string}[] = tromboneFiles) => {
    setIsCreationMode(false);
    const htmlFile = filesToUse.find(f => f.path.endsWith('.html'));
    if (!htmlFile) {
      alert("Aucun fichier HTML trouvé dans le Trombone !");
      return;
    }
    
    // Auto-create folder explicitely before sending to DeepSeek
    const genId = newProjectName.trim() 
      ? "Projet_" + newProjectName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4)
      : "Design_" + htmlFile.path.replace(".html", "").replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);
      
    const designProjectId = activeProject || genId;

    if (!activeProject) {
      setActiveProject(designProjectId);
      try {
        await fetch("http://localhost:5005/api/fs/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            project: designProjectId,
            file: "README.md",
            content: `# ${newProjectName || designProjectId}\n\nInitialisé par Tiger IA V0 (Design-First).`
          })
        });
      } catch (err) {
        console.error("[IDE] Erreur création auto du dossier", err);
      }
    }
    
    const appendedToTrombone = filesToUse.filter(f => f.path !== htmlFile.path);
    const htmlContent = htmlFile.content;

    const responseMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      role: "assistant", 
      content: `Mode "Design-First" activé. 🎨\n\nTransmission du design au LLM avec les ${appendedToTrombone.length} fichiers du Trombone intégrés.\nCâblage en cours...`,
      widget: "phases"
    };
    setActivePhase(5);
    setMessages((prev) => [...prev, responseMsg]);
    
    let currentDropPhase = 5;
    const dropInterval = setInterval(() => {
      currentDropPhase++;
      if (currentDropPhase > 11) {
        clearInterval(dropInterval);
      } else {
        setActivePhase(currentDropPhase);
      }
    }, 3000);
    
    if (typeof window !== "undefined" && (window as any).AndroidBridge && (window as any).AndroidBridge.showToast) {
      (window as any).AndroidBridge.showToast("Mode Design-First Activé !");
    }

    if (typeof window !== "undefined") {
      const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
      
      let contextualData = "";
      if (appendedToTrombone.length > 0) {
        contextualData = "\n\n--- Fichiers de contexte complémentaires (Trombone) ---\n";
        appendedToTrombone.forEach(f => {
          contextualData += `\n[Fichier: ${f.path}]\n\`\`\`\n${f.content.substring(0, 3000)}\n\`\`\`\n`;
        });
      }

      let metadataBlock = "";
      if (newProjectName.trim() || newProjectStack.trim() || newProjectDesc.trim()) {
         metadataBlock = `\n--- MÉTADONNÉES DU PROJET ---
Nom : ${newProjectName || "Non spécifié"}
Stack / Structure : ${newProjectStack || "Non spécifiée"}
Description & Objectifs : ${newProjectDesc || "Non spécifiés"}
-----------------------------\n`;
      }

      const finalPrompt = `Voici le code HTML/CSS d'une interface générée par Stitch.${metadataBlock}
Ta mission est de créer un projet React (Vite + TSX) COMPLET et autonome à partir de ce design.

Tu DOIS impérativement générer TOUS les fichiers nécessaires pour que le projet soit exécutable immédiatement, notamment :
1. \`package.json\` (avec les scripts vite, et react/react-dom)
2. \`index.html\` (le point d'entrée)
3. \`vite.config.ts\`
4. \`src/main.tsx\` et \`src/App.tsx\`
5. Tous les composants React déduits du HTML (dans \`src/components/\`)
6. Le CSS (dans \`src/styles/\` ou similaire)
          
CODE HTML:
\`\`\`html
${htmlContent}
\`\`\`${contextualData}

RÈGLE ABSOLUE POUR LA RÉPONSE (KIROV5) :
Tu dois UNIQUEMENT répondre avec un objet JSON valide contenant les fichiers générés. Aucun texte explicatif avant ou après le JSON.
Format attendu:
\`\`\`json
{
  "files": [
    { "path": "src/App.tsx", "content": "...", "language": "tsx" }
  ]
}
\`\`\`
`;
      
      const bridge = (window as any).AndroidBridge;
      if (bridge && bridge.openAIWithPrompt) {
         const logicAiUrl = logicAi === "custom" ? (localStorage.getItem("tiger_customAiUrl") || "https://chat.deepseek.com/") : `https://chat.${logicAi}.com/`;
         bridge.openAIWithPrompt(logicAiUrl, finalPrompt);
         if (bridge.showToast) bridge.showToast("HTML injecté. Câblage sur " + logicAi.toUpperCase() + " !");
      } else {
        fetch("http://localhost:5005/bridge/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_ai: logicAi,
            prompt: finalPrompt,
            auto_submit: true,
            project_id: designProjectId,
            phase_num: 5
          })
        })
        .then(res => console.log("[Bridge] Prompt HTML + Contexte envoyé avec succès, status:", res.status))
        .catch((err) => console.error("[Bridge] Erreur lors de l'envoi du prompt:", err));
      }
    }
  };

  // --- WIDGET COMPONENTS ---

  const renderCarousel = (items: React.ReactNode[]) => (
    <div className="flex overflow-x-auto gap-4 py-4 px-2 snap-x snap-mandatory hide-scrollbar">
      {items.map((item, idx) => (
        <div key={idx} className="snap-center shrink-0">
          {item}
        </div>
      ))}
    </div>
  );

  // --- HELPERS IDE ---
  const renderFsTree = (node: any, level = 0) => {
    if (!node) return null;
    if (node.type === 'directory') {
      return (
        <div key={node.path} className="flex flex-col">
          <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer text-gray-300 text-sm" style={{ paddingLeft: `${level * 12 + 8}px` }}>
            <span className="text-orange-400">📁</span>
            <span className="truncate font-bold">{node.name}</span>
          </div>
          {node.children && node.children.map((child: any) => renderFsTree(child, level + 1))}
        </div>
      );
    } else {
      return (
        <div 
          key={node.path} 
          className={`flex items-center justify-between px-2 py-1 hover:bg-white/10 cursor-pointer text-sm group ${activeFile === node.path ? 'bg-cyan/20 text-cyan border-l-2 border-cyan' : 'text-gray-400'}`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => setActiveFile(node.path)}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-blue-400">📄</span>
            <span className="truncate">{node.name}</span>
          </div>
          <button 
            className="hidden group-hover:block text-xs text-white bg-white/20 rounded px-1 hover:bg-cyan/50"
            title="Ajouter au Trombone"
            onClick={(e) => { e.stopPropagation(); attachToTrombone(node.path); }}
          >
            📎
          </button>
        </div>
      );
    }
  };

  const handleIDEAction = (action: string) => {
    if (!activeProject) return;
    let prompt = "";
    if (action === "suture") prompt = `Deepseek corrige et modifie les bugs (Suture) pour le projet [${activeProject}].\n\n`;
    if (action === "refactor") prompt = `Deepseek modifie et refactorise le code pour le projet [${activeProject}].\n\n`;
    if (action === "improve") prompt = `Deepseek ajoute des améliorations pour le projet [${activeProject}].\n\n`;
    
    if (tromboneFiles.length > 0) {
      prompt += "Voici les fichiers de contexte depuis le trombone :\n\n";
      tromboneFiles.forEach(f => {
        prompt += `--- ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\`\n\n`;
      });
      // Optionnel : vider le trombone après ? 
      // setTromboneFiles([]); 
    }
    handleSend(prompt);
  };


  const WidgetProjects = () => {
    const [liveProjects, setLiveProjects] = useState<{name: string, desc: string, bg: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const cardStyles = [
        "bg-gradient-to-br from-[#bf6969]/80 to-[#c27042]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#a387b9]/80 to-[#aa6b73]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#e4a37f]/80 to-[#bf6969]/90 backdrop-blur-md",
        "bg-gradient-to-br from-[#aa6b73]/80 to-[#c27042]/90 backdrop-blur-md"
      ];
      fetch("http://localhost:5005/api/projects")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.projects) {
            setLiveProjects(data.projects.map((p: string, i: number) => ({
              name: p,
              desc: "Environnement Local",
              bg: cardStyles[i % cardStyles.length]
            })));
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
    }, []);

    if (isLoading) {
      return <div className="p-4 text-cyan text-sm italic">Actualisation de la liste des projets...</div>;
    }

    if (liveProjects.length === 0) {
      return (
        <div className="p-4 text-cyan text-sm italic">
          Recherche des projets sur votre disque dur... (Assurez-vous que le Moteur Electron est lancé et rechargez la page).
        </div>
      );
    }

    return renderCarousel([
      <div 
        key="new-v0"
        className={`w-64 h-48 rounded-2xl p-5 border-2 border-dashed border-cyan/50 shadow-xl flex flex-col justify-center items-center hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-black/80 to-cyan/10 relative group`}
        onClick={() => { setActiveProject(null); setNewProjectName(""); setIsNewProjectModalOpen(true); }}
      >
        <div className="absolute inset-0 bg-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="text-5xl mb-3 drop-shadow-[0_0_10px_rgba(8,179,201,0.8)] group-hover:scale-110 transition-transform">✨</div>
        <h3 className="text-lg font-black text-white text-center">Nouveau Projet (v0)</h3>
        <p className="text-xs text-cyan font-bold text-center mt-2 tracking-widest uppercase">Lancer l'UI/UX</p>
      </div>,
      ...liveProjects.map((p, i) => (
      <div 
        key={i} 
        className={`w-64 h-48 rounded-2xl p-5 border border-white/20 shadow-xl flex flex-col justify-between hover:scale-105 transition-transform relative overflow-hidden group cursor-pointer`} 
        style={{ background: isClient ? getCachedGradient('proj-'+i, 0.7) : 'rgba(0,0,0,0.5)' }}
        onClick={() => setActiveProject(p.name)}
      >
        {/* Effet de grain / texture pour casser le côté "uni" */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>
        
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-0" />
        
        <div className="z-10 relative pointer-events-none">
          <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1 drop-shadow-md">PROJET</div>
          <h3 className="text-xl font-black text-white mb-2 break-all drop-shadow-lg leading-tight">{p.name}</h3>
        </div>
        <div className="z-10 relative text-sm text-white/90 font-medium mb-3 drop-shadow-md pointer-events-none">{p.desc}</div>
        
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            try {
              window.dispatchEvent(new CustomEvent('open-mouchard'));
              const res = await fetch("http://localhost:5005/api/bridge/launch-project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: p.name })
              });
              const data = await res.json();
            } catch (err: any) {
              alert("Erreur de lancement : " + err.message);
            }
          }}
          className="z-10 bg-white/20 hover:bg-white/40 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
          title="Installer les dépendances et Lancer le projet"
        >
          🚀 Installer & Lancer
        </button>
      </div>
    ))]);
  };

  const WidgetNews = () => {
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    const news = [
      { 
        id: 1, 
        title: "DeepSeek V3", 
        desc: "Le nouveau modèle surpasse GPT-4 sur les tests logiques.", 
        tag: "LLM", 
        content: "DeepSeek a annoncé aujourd'hui la sortie de la version V3 de son modèle phare. Il présente des avancées majeures en logique formelle, générant du code complexe avec une précision inégalée.\n\nL'architecture Mixture of Experts (MoE) a été drastiquement optimisée pour réduire la latence de moitié tout en gardant une consommation mémoire réduite. Ce modèle Open Source promet de bousculer la domination de l'écosystème fermé de OpenAI."
      },
      { 
        id: 2, 
        title: "React 19", 
        desc: "Le compilateur React est enfin disponible en version beta.", 
        tag: "Frontend", 
        content: "Après des années d'attente, le projet 'React Forget' est officiellement publié sous le nom de React Compiler dans React 19.\n\nFini les useMemo et useCallback manuels : le compilateur gère désormais l'optimisation des rendus automatiquement à l'étape du build. Cela simplifie considérablement le code des développeurs tout en garantissant des performances maximales côté client."
      },
      { 
        id: 3, 
        title: "Next.js 15", 
        desc: "Mise à jour majeure du cache et de l'architecture App Router.", 
        tag: "Framework", 
        content: "Vercel a lancé Next.js 15 avec de nombreux changements profonds.\n\nLe système de cache par défaut de (fetch) n'est plus agressif, répondant enfin aux retours de la communauté qui le trouvait trop imprévisible. De plus, l'expérience développeur (DX) lors de l'utilisation du turbopack a été grandement améliorée, rendant les rechargements à chaud (HMR) quasi instantanés sur les très gros projets."
      },
    ];

    if (selectedArticle) {
      return (
        <div className="w-full max-w-3xl backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-4 relative animate-fadeIn" style={{ background: isClient ? getCachedGradient('news-detail', 0.9) : 'rgba(0,0,0,0.9)' }}>
          <button 
            onClick={() => setSelectedArticle(null)}
            className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold transition-colors z-20"
            title="Fermer"
          >
            ✕
          </button>
          
          <span className="px-3 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-md mb-4 inline-block">{selectedArticle.tag}</span>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">{selectedArticle.title}</h2>
          <p className="text-gray-300 font-medium text-sm md:text-base mb-6 leading-relaxed border-l-4 border-cyan/50 pl-4">
            {selectedArticle.desc}
          </p>
          
          <div className="w-full h-px bg-white/10 mb-6"></div>
          
          <div className="text-gray-200 text-sm md:text-base leading-loose whitespace-pre-line">
            {selectedArticle.content}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-mono">SOURCE: TIGER NEWS NETWORK</span>
            <button 
              onClick={() => setSelectedArticle(null)}
              className="px-6 py-3 bg-white/5 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 hover:border-cyan"
            >
              ← Retour à la liste
            </button>
          </div>
        </div>
      );
    }

    return renderCarousel(news.map(n => (
      <div key={n.id} className="w-72 h-48 rounded-2xl p-5 border border-white/10 backdrop-blur-md flex flex-col hover:border-cyan/50 transition-colors shadow-lg" style={{ background: isClient ? getCachedGradient('news-'+n.id, 0.7) : 'rgba(0,0,0,0.7)' }}>
        <span className="self-start px-2 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-md mb-3">{n.tag}</span>
        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{n.title}</h3>
        <p className="text-gray-400 text-sm flex-1">{n.desc}</p>
        <button 
          onClick={() => setSelectedArticle(n)}
          className="text-cyan text-sm font-semibold hover:underline self-end cursor-pointer"
        >
          Lire l&apos;article →
        </button>
      </div>
    )));
  };

  const WidgetYouTube = () => {
    const videos = [
      { title: "Créer une IA Souveraine", channel: "Tiger Channel", views: "1.2k" },
      { title: "React Tailwind Masterclass", channel: "UI Design", views: "5.4k" },
      { title: "Android Bridge Capacitor", channel: "Mobile Dev", views: "800" },
    ];
    return renderCarousel(videos.map((v, i) => (
      <div key={i} className="w-64 rounded-2xl overflow-hidden border border-red-500/30 hover:border-red-500 transition-colors shadow-lg" style={{ background: isClient ? getCachedGradient('yt-'+i, 0.6) : 'rgba(0,0,0,0.6)' }}>
        <div className="h-32 bg-gray-800 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/40 to-transparent"></div>
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg z-10 cursor-pointer hover:scale-110 transition-transform">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-white font-bold text-sm leading-tight mb-1">{v.title}</h3>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{v.channel}</span>
            <span>{v.views} vues</span>
          </div>
        </div>
      </div>
    )));
  };

  // --- RENDERING PRINCIPAL ---

  const WidgetPhases = () => {
    const allPhases = [
      "Setup", "Index", "React", "CSS", "Utils", "Vite",
      "Tests", "Package", "Vérif", "Bridge", "Build"
    ];
    
    return (
      <div className="mt-2">
        {renderCarousel(allPhases.map((p, idx) => {
          const step = idx + 1;
          const isDone = step < activePhase;
          const isCurrent = step === activePhase;
          
          let cardBg = "bg-glass border-white/10 opacity-50"; 
          if (isDone) cardBg = "bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/50 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
          if (isCurrent) cardBg = "bg-gradient-to-br from-cyan/20 to-blue-900/40 border-cyan text-white shadow-[0_0_20px_rgba(8,179,201,0.5)] animate-pulse hover:scale-105 cursor-pointer";

          return (
            <div 
              key={idx} 
              onClick={() => {
                if (p === "Build" || isCurrent || isDone) {
                  // Ouvre l'IDE sur le projet qui vient d'être lancé
                  const lastProj = localStorage.getItem("tiger_lastGeneratedProject");
                  if (lastProj) setActiveProject(lastProj);
                }
              }}
              className={`w-40 h-48 rounded-2xl p-4 border flex flex-col justify-between transition-all duration-500 ${cardBg}`}
              title={p === "Build" ? "Cliquez pour ouvrir l'IDE sur le projet généré" : ""}
            >
              <div className="text-3xl font-black opacity-20">
                {step.toString().padStart(2, '0')}
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{p}</h4>
                <div className="text-xs opacity-70">
                  {isDone ? "✓ Terminé" : isCurrent ? "En cours..." : "En attente"}
                </div>
              </div>
              {isCurrent && (
                <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-cyan w-1/2 animate-ping rounded-full"></div>
                </div>
              )}
              {p === "Build" && (
                <div className="mt-2 text-[10px] text-cyan font-bold uppercase tracking-widest flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                  <span>🚀</span> Ouvrir IDE
                </div>
              )}
            </div>
          );
        }))}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#1e1e1e] to-black flex flex-col overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Floating Settings Modal */}
      {isSettingsOpen && (
        <div 
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" 
          style={{ background: isClient ? getCachedGradient('modal', 0.6) : 'rgba(0,0,0,0.6)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSettingsOpen(false);
          }}
        >
          <WidgetSettings 
            isModal={true} 
            onClose={() => setIsSettingsOpen(false)} 
            initialTab="connexion"
            isClient={isClient}
            getCachedGradient={getCachedGradient}
            mouchardLogs={mouchardLogs}
            activePhase={activePhase}
            availableProjects={availableProjects}
            setAvailableProjects={setAvailableProjects}
            selectedLaunchProject={selectedLaunchProject}
            setSelectedLaunchProject={setSelectedLaunchProject}
            isMobileNative={isMobileNative}
          />
        </div>
      )}

      {/* PRD Packs Modal */}
      {isPrdModalOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: isClient ? getCachedGradient('modal-prd', 0.8) : 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-5xl bg-black/95 border border-indigo-500/50 shadow-[0_0_50px_rgba(79,70,229,0.4)] rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-900/30">
              <h3 className="text-xl font-black text-indigo-300 tracking-wider flex items-center gap-3">
                💎 SÉLECTION DES PACKS PRD (Contexte Suture)
              </h3>
              <button onClick={() => setIsPrdModalOpen(false)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-4 bg-indigo-900/10 border-b border-white/5 text-sm text-indigo-200/80 px-6">
              Sélectionnez les paquets de connaissances (Product Requirement Documents) à injecter dans le contexte système de l'Intelligence Artificielle avant de générer le projet. 
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 hide-scrollbar">
              {AVAILABLE_PACKS.map(pack => {
                const Icon = pack.icon;
                const isSelected = selectedPacks.includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    onClick={() => togglePack(pack.id)}
                    className={`relative p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all text-center ${isSelected ? 'bg-indigo-600/40 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : pack.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {pack.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-indigo-300">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-6 border-t border-white/10 bg-black flex justify-between items-center">
              <div className="text-sm font-bold text-indigo-400">
                {selectedPacks.length} pack(s) sélectionné(s)
              </div>
              <button onClick={() => setIsPrdModalOpen(false)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all">
                Valider la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 backdrop-blur-md border-b border-white/10 z-10 flex justify-between items-center shadow-lg" style={{ background: isClient ? getCachedGradient('header', 0.3) : 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(8,179,201,0.4)]" style={{ background: isClient ? getCachedGradient('logo', 1) : '#08b3c9' }}>
            <span className="text-xl">🐯</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wider">TIGER IA</h1>
            <p className="text-xs text-cyan font-medium">OS Souverain v2.1</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10 w-full">
        
        {/* === NOUVEAU : ZONE IDE INTEGREE === */}
        {activeProject && (
          <div className="flex flex-1 overflow-hidden h-full animate-fadeIn">
            
            {/* 1. Left Action Bar */}
            <div className="w-16 bg-black/80 border-r border-white/10 flex flex-col items-center py-4 gap-6 z-20 shadow-xl">
              <button title="Fermer le projet" onClick={() => { setActiveProject(null); setActiveFile(null); }} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all mb-4">
                ✕
              </button>
              
              <button title="Suture (Correction Bug)" onClick={() => handleIDEAction("suture")} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-cyan/20 text-xl border border-white/10 hover:border-cyan flex items-center justify-center transition-all group relative">
                🩺
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-cyan pointer-events-none transition-opacity">Auto-Suture</span>
              </button>
              
              <button title="Refactoring" onClick={() => handleIDEAction("refactor")} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-purple-500/20 text-xl border border-white/10 hover:border-purple-500 flex items-center justify-center transition-all group relative">
                🔄
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-purple-400 pointer-events-none transition-opacity">Refactoring</span>
              </button>
              
              <button title="Amélioration" onClick={() => handleIDEAction("improve")} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-yellow-500/20 text-xl border border-white/10 hover:border-yellow-500 flex items-center justify-center transition-all group relative">
                ✨
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-yellow-400 pointer-events-none transition-opacity">Amélioration</span>
              </button>

              <div className="flex-1"></div>

              <button 
                title={isIdeFullscreen ? "Réduire (Afficher le Chat)" : "Pleine Page (Masquer le Chat)"}
                onClick={() => setIsIdeFullscreen(!isIdeFullscreen)} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative border ${isIdeFullscreen ? 'bg-cyan text-black border-cyan' : 'bg-white/5 hover:bg-cyan/20 text-cyan border-white/10 hover:border-cyan'}`}
              >
                {isIdeFullscreen ? '🗗' : '🗖'}
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-cyan pointer-events-none transition-opacity">
                  {isIdeFullscreen ? 'Mode Normal' : 'Pleine Page'}
                </span>
              </button>

              <button 
                title="Lancer Preview" 
                onClick={() => {
                  if (!activeProject) return;
                  fetch("http://localhost:5005/api/bridge/launch-project", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project_id: activeProject })
                  }).catch(e => console.error("Erreur lacement preview:", e));
                }} 
                className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white text-xl border border-green-500/30 hover:border-green-500 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] group relative"
              >
                🚀
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-green-400 pointer-events-none transition-opacity font-bold">Lancer Preview</span>
              </button>
            </div>

            {/* 2. Explorateur de fichiers */}
            <div className="w-64 bg-[#0a0a0a]/95 border-r border-white/10 overflow-y-auto flex flex-col hide-scrollbar z-20 shadow-2xl">
              <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10 flex flex-col gap-2">
                <span className="text-[10px] text-cyan font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
                  Projet Actif
                </span>
                <span className="text-white font-bold text-sm truncate">{activeProject}</span>
              </div>
              <div className="py-2">
                {fsTree ? renderFsTree(fsTree) : <div className="text-gray-500 text-xs px-4 py-2 animate-pulse">Scan du projet...</div>}
              </div>
            </div>

            {/* 3. Editeur Monaco et Preview Split */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e] z-20 shadow-2xl relative">
              <div className="h-12 bg-[#252526] border-b border-black flex justify-between items-center px-4">
                <div className="flex items-center gap-3">
                  <span className="text-blue-400 text-lg">{activeFile ? '📄' : '📁'}</span>
                  <span className="text-sm text-gray-300 font-mono">{activeFile || 'Aucun fichier sélectionné'}</span>
                </div>
                <div className="flex gap-4 items-center">
                  {previewUrl && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-green-400 animate-pulse font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span> SERVER:
                      </div>
                      <input 
                        type="text" 
                        value={previewInput} 
                        onChange={(e) => setPreviewInput(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setPreviewUrl(previewInput);
                        }}
                        className="bg-black/50 border border-green-500/30 text-green-400 text-[10px] px-2 py-1 rounded outline-none focus:border-green-400 w-40 font-mono shadow-[0_0_10px_rgba(34,197,94,0.1)] transition-all"
                        title="Modifier et taper Entrée"
                      />
                      <button onClick={() => setPreviewUrl(previewInput)} className="text-[10px] bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-2 py-1 rounded font-bold border border-green-500/30">Go</button>
                    </div>
                  )}
                  <button 
                    onClick={() => handleSaveFile(fileContent)} 
                    disabled={!activeFile}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeFile ? 'bg-cyan/20 text-cyan hover:bg-cyan hover:text-black border border-cyan/30 shadow-[0_0_10px_rgba(8,179,201,0.2)]' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                  >
                    SAUVEGARDER (CTRL+S)
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative flex">
                {/* Section Code */}
                <div className={`relative flex flex-col ${previewUrl ? 'w-1/2 border-r border-black' : 'w-full'}`}>
                  {activeFile ? (
                    <Editor 
                      height="100%" 
                      theme="vs-dark" 
                      path={activeFile}
                      language={activeFile.endsWith('.tsx') || activeFile.endsWith('.ts') ? 'typescript' : activeFile.endsWith('.css') ? 'css' : activeFile.endsWith('.html') ? 'html' : activeFile.endsWith('.json') ? 'json' : 'javascript'} 
                      value={fileContent} 
                      onChange={(val) => setFileContent(val || "")} 
                      options={{ 
                        minimap: { enabled: false }, 
                        fontSize: 14,
                        wordWrap: "on",
                        padding: { top: 16 }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-4">
                      <span className="text-6xl opacity-20">🐯</span>
                      <span className="font-medium tracking-wide">Sélectionnez un fichier dans l'explorateur pour l'éditer</span>
                    </div>
                  )}
                </div>

                {/* Section Preview Iframe */}
                {previewUrl && (
                  <div className="w-1/2 relative bg-white">
                    <iframe src={previewUrl} className="w-full h-full border-none" />
                    <button 
                      onClick={() => setPreviewUrl(null)} 
                      className="absolute top-2 right-4 bg-black/80 border border-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg z-50"
                      title="Fermer la Preview"
                    >
                      ✕
                    </button>
                    <button 
                      onClick={() => window.open(previewUrl, '_blank')} 
                      className="absolute top-2 right-14 bg-black/80 border border-white/20 text-white rounded-full px-3 h-8 flex items-center justify-center hover:bg-cyan hover:text-black transition-all shadow-lg z-50 text-xs font-bold"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      ↗ Ouvrir
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Chat Area (Responsive) */}
        <main 
          className={`${activeProject ? (isIdeFullscreen ? 'hidden w-0' : 'w-96 min-w-[24rem]') : 'flex-1'} border-l border-white/20 bg-black/60 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] overflow-y-auto p-4 md:p-8 z-10 hide-scrollbar flex flex-col relative transition-all duration-500 ease-in-out`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
        >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-cyan/20 backdrop-blur-sm border-4 border-dashed border-cyan rounded-3xl m-4 flex items-center justify-center pointer-events-none">
            <h2 className="text-3xl font-black text-cyan drop-shadow-lg text-center px-4">Glissez votre projet Stitch (.zip, .html, .md, .png)<br/>pour préparer le câblage !</h2>
          </div>
        )}

        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 pb-10">
          
          {/* Mobile-style Home Screen Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 pt-8 pb-4 max-w-3xl mx-auto w-full px-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-white/10 rounded-[20px] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-2xl group-hover:scale-105 group-hover:border-pink/50 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all" style={{ background: isClient ? getCachedGradient('icon-settings', 0.8) : 'rgba(30,30,30,0.8)' }}>
                ⚙️
              </div>
              <span className="text-xs md:text-sm text-white font-bold tracking-wider drop-shadow-md">Réglages</span>
            </button>

            {/* NOUVEAU BOUTON : ASSISTANT IA DIRECT */}
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
                  const aiUrl = logicAi === "custom" ? (localStorage.getItem("tiger_customAiUrl") || "https://chat.deepseek.com/") : `https://chat.${logicAi}.com/`;
                  
                  const bridge = (window as any).AndroidBridge;
                  if (bridge && bridge.openAIWithPrompt) {
                    bridge.openAIWithPrompt(aiUrl, "Bonjour ! Je viens d'ouvrir l'Assistant IA depuis le menu principal de Tiger IA.");
                  } else {
                    window.open(aiUrl, "_blank");
                  }
                }
              }}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-white/10 rounded-[20px] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-2xl group-hover:scale-105 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all" style={{ background: isClient ? getCachedGradient('icon-ai', 0.8) : 'rgba(80,20,200,0.8)' }}>
                🧠
              </div>
              <span className="text-xs md:text-sm text-white font-bold tracking-wider drop-shadow-md">Assistant IA</span>
            </button>
            
            <button 
              onClick={() => {
                handleSend("Mes projets");
                setInput("");
              }}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-white/10 rounded-[20px] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-2xl group-hover:scale-105 group-hover:border-cyan/50 group-hover:shadow-[0_0_30px_rgba(8,179,201,0.3)] transition-all" style={{ background: isClient ? getCachedGradient('icon-projects', 0.8) : 'rgba(10,50,100,0.8)' }}>
                📁
              </div>
              <span className="text-xs md:text-sm text-white font-bold tracking-wider drop-shadow-md">Projets</span>
            </button>
            
            {/* NOUVEAU BOUTON : PACKS PRD */}
            <button 
              onClick={() => setIsPrdModalOpen(true)}
              className="group flex flex-col items-center gap-3 relative"
            >
              {selectedPacks.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white/20 z-10">
                  {selectedPacks.length}
                </div>
              )}
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-indigo-500/50 rounded-[20px] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-105 group-hover:border-indigo-400 group-hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] transition-all bg-indigo-900/60 backdrop-blur-md">
                💎
              </div>
              <span className="text-xs md:text-sm text-indigo-300 font-bold tracking-wider drop-shadow-md">Packs PRD</span>
            </button>

            <button 
              onClick={() => {
                handleSend("Actualités IA");
                setInput("");
              }}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-white/10 rounded-[20px] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-2xl group-hover:scale-105 group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all" style={{ background: isClient ? getCachedGradient('icon-news', 0.8) : 'rgba(200,80,20,0.8)' }}>
                📰
              </div>
              <span className="text-xs md:text-sm text-white font-bold tracking-wider drop-shadow-md">Actualités</span>
            </button>
          </div>

          <div className="w-full h-px bg-white/10 my-4"></div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div 
                className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl backdrop-blur-md border border-white/20 text-gray-100 shadow-xl ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={{ background: isClient ? getCachedGradient('msg-'+msg.id, msg.role === "user" ? 0.8 : 0.6) : 'rgba(0,0,0,0.6)' }}
              >
                {msg.content}
              </div>
              
              {/* Dynamic Widgets Injected into Chat */}
              {msg.widget === "projects" && <WidgetProjects />}
              {msg.widget === "news" && <WidgetNews />}
              {msg.widget === "youtube" && <WidgetYouTube />}
              {msg.widget === "settings" && <WidgetSettings isClient={isClient} getCachedGradient={getCachedGradient} mouchardLogs={mouchardLogs} activePhase={activePhase} availableProjects={availableProjects} setAvailableProjects={setAvailableProjects} selectedLaunchProject={selectedLaunchProject} setSelectedLaunchProject={setSelectedLaunchProject} isMobileNative={isMobileNative} />}
              {msg.widget === "phases" && <WidgetPhases />}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Right Sidebar (Mouchard d'Installation) */}
      {isRightSidebarOpen && (
        <aside className="w-80 border-l border-white/20 flex flex-col z-40 absolute right-0 top-[72px] bottom-[48px] animate-fadeIn shadow-[-10px_0_30px_rgba(0,0,0,0.5)] bg-black">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]">
            <h3 className="text-cyan font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
              Terminal
            </h3>
            <button onClick={() => setIsRightSidebarOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto flex flex-col-reverse hide-scrollbar bg-black">
            <div>
              {mouchardLogs.map((log, idx) => {
                let colorClass = "text-[#52c1c9]"; // Teal clair (Défaut)
                if (log.includes("[INSTALL]")) colorClass = "text-[#f29f43]"; // Orange
                if (log.includes("[SERVER]")) colorClass = "text-[#0ab7d4]"; // Cyan vif
                if (log.includes("[IDE]")) colorClass = "text-[#e27396]"; // Rose
                if (log.includes("WARN") || log.includes("ERR")) colorClass = "text-red-500";
                
                return (
                  <div key={idx} className={`mb-1 opacity-90 break-words ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      )}
      
      </div> {/* Fermeture div flex-1 principal pour que le footer passe en bas */}

      {/* Input Area + Connection Status Bar */}
      <footer className="backdrop-blur-2xl border-t border-white/10 z-10 flex flex-col" style={{ background: isClient ? getCachedGradient('footer', 0.6) : 'rgba(0,0,0,0.6)' }}>
        {/* Connection Status Indicators */}
        <div className="px-6 py-2 border-b border-white/5 flex gap-4 md:gap-8 overflow-x-auto hide-scrollbar text-[10px] font-bold tracking-wider uppercase">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
            <span className="text-green-400">Online</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
            <span className="text-blue-400">Ext: Tiger</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
            <span className="text-purple-400">LLM: DeepSeek</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_#08b3c9] animate-pulse"></span>
            <span className="text-cyan">Electron</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 opacity-50">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            <span className="text-gray-400">Mobile (Capacitor)</span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-0 pt-2 md:px-6 md:pb-0 md:pt-3 relative w-full flex flex-col gap-2">
          
          {/* LE TROMBONE (Fichiers attachés) */}
          {tromboneFiles.length > 0 && (
            <div className="flex gap-2 px-2 overflow-x-auto hide-scrollbar pb-2">
              {tromboneFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan text-xs px-3 py-1.5 rounded-full whitespace-nowrap animate-fadeIn">
                  <span>📎 {f.path.split('/').pop() || f.path.split('\\').pop()}</span>
                  <button 
                    onClick={() => setTromboneFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="hover:text-red-400 font-bold ml-1"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {isCreationMode ? (
            <div id="creation-mode-container" className="flex flex-col gap-4 bg-black/80 p-5 rounded-3xl border border-cyan/30 shadow-2xl backdrop-blur-xl animate-fadeIn relative max-h-[65vh] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-center mb-2 sticky top-0 bg-black/90 z-10 py-2 border-b border-cyan/20">
                 <h3 className="text-cyan font-bold flex items-center gap-2 text-lg uppercase"><span className="animate-pulse w-2 h-2 bg-cyan rounded-full"></span> ⚙️ Configuration du projet</h3>
                 <button onClick={() => setIsCreationMode(false)} className="text-slate-400 hover:text-white p-2">✕</button>
               </div>
               
               {/* ZONE 1: CIBLAGE ET INSTRUCTIONS */}
               <div className="flex flex-col gap-3 bg-black/40 p-4 rounded-xl border border-white/10">
                 <div>
                   <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">📁 CIBLER LE PROJET :</label>
                   <select 
                     value={activeProject || ""} 
                     onChange={e => {
                       setActiveProject(e.target.value);
                       if (e.target.value) {
                         setNewProjectName(e.target.value.replace('Projet_', '').split('_')[0]);
                       } else {
                         setNewProjectName("");
                       }
                     }} 
                     className="w-full bg-slate-800/50 text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-sm"
                   >
                     <option value="">-- SÉLECTIONNER UN PROJET --</option>
                     {realProjects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                   </select>
                 </div>
                 
                 <div>
                   <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">📝 INSTRUCTIONS SPÉCIFIQUES :</label>
                   <textarea 
                     value={newProjectInstructions} 
                     onChange={e => setNewProjectInstructions(e.target.value)} 
                     placeholder="Instructions pour le Patch ou la modification..." 
                     className="w-full bg-slate-800/50 text-white border border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-cyan h-12 resize-none text-sm"
                   ></textarea>
                 </div>
               </div>

               {/* ZONE 2: PARAMÈTRES ET CIBLES */}
               <div className="flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                  <div className="text-cyan font-bold uppercase text-xs border-b border-dashed border-cyan/30 pb-1">⚡ Paramètres & Cibles</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">Nom du Projet</label>
                      <div className="flex gap-2">
                        <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} disabled={!!activeProject} placeholder="Ex: MonSuperProjet" className="flex-1 bg-slate-800/50 text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-sm disabled:opacity-50" />
                      <button 
                        onClick={async (e) => {
                          if (!newProjectName.trim()) { alert("Veuillez entrer un nom de projet."); return; }
                          const genId = "Projet_" + newProjectName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
                          
                          // Use a local state or just update a temporary variable if we don't want to add a top-level state just for this button
                          const btn = e.currentTarget;
                          btn.innerText = '⏳ Création...';
                          btn.disabled = true;
                          
                          try {
                            const API_BASE = 'http://localhost:5005';
                            
                            // 1. Création via /api/fs/write (sans timeout artificiel pour laisser le temps au fallback réseau Windows)
                            let success = false;
                            
                            let res = await fetch(`${API_BASE}/api/fs/write`, { 
                              method: "POST", 
                              headers: { "Content-Type": "application/json" }, 
                              body: JSON.stringify({ 
                                project: genId,
                                file: "README.md",
                                content: `# ${newProjectName}\n\nInitialisé par Tiger IA V0.\nStack : ${newProjectStack}\nDescription : ${newProjectDesc}`
                              })
                            }).catch(err => {
                                console.error("Erreur API locale:", err);
                                return null;
                            });
                            
                            if (res && res.ok) {
                                success = true;
                                console.log("[CREATION] Dossier créé avec succès via /api/fs/write");
                                // 2. Notification Asynchrone au Cerveau Python (Fire & Forget, pour ne pas bloquer l'UI)
                                fetch(`${API_BASE}/v1/mission/start`, {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ name: genId, prompt: newProjectDesc.trim() || "Init", stack: newProjectStack })
                                }).catch(() => null);
                            } else {
                                console.warn("[CREATION] L'API locale a échoué. Tentative via le Python.");
                                // Fallback sur l'ancienne méthode
                                let pyRes = await fetch(`${API_BASE}/v1/mission/start`, {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ name: genId, prompt: newProjectDesc.trim() || "Init", stack: newProjectStack })
                                }).catch(() => null);
                                if (pyRes && pyRes.ok) success = true;
                            }
                            
                            if (success) {
                              setActiveProject(genId);
                              
                              // --- Enregistrement dans la mémoire RAG HERMES ---
                              const memStr = `[PROJET: ${genId}] QUOI: ${newProjectDesc.trim()} | OÙ: ${newProjectStack} | COMMENT (Patchs): ${selectedPacks.join(', ')}`;
                              let oldMem = localStorage.getItem('hermes_memory') || "";
                              if (!oldMem.includes(`[PROJET: ${genId}]`)) {
                                  localStorage.setItem('hermes_memory', oldMem + "\\n- " + memStr);
                                  
                                  // Avertir le chat Tiger
                                  setMessages(prev => [...prev, {
                                    id: Date.now().toString() + "_hermes",
                                    role: "assistant",
                                    content: `[SYSTEM REPORT]: Configuration validée pour le projet ${genId}.\nDonnées sauvegardées dans la mémoire RAG :\n${memStr}`,
                                    widget: "phases"
                                  }]);
                              }
                            } else {
                              btn.innerText = '❌ ERREUR API';
                              btn.style.background = '#ef4444';
                              setTimeout(() => {
                                btn.innerText = 'Valider';
                                btn.style.background = '';
                                btn.disabled = false;
                              }, 3000);
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erreur de connexion au Bridge local.");
                            btn.innerText = 'Valider';
                            btn.disabled = false;
                          }
                        }}
                        disabled={!!activeProject || !newProjectName.trim()}
                        className="px-4 py-2 bg-cyan/20 text-cyan hover:bg-cyan/40 border border-cyan/50 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                      >
                        {activeProject ? '✅ Validé' : 'Valider'}
                      </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">Stack Technique</label>
                      <select value={newProjectStack} onChange={e => setNewProjectStack(e.target.value)} className="w-full bg-slate-800/50 text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-sm">
                         <option value="Vite + React + Tailwind + TS">Vite + React + Tailwind + TS</option>
                         <option value="Next.js + Tailwind + TS">Next.js + Tailwind + TS</option>
                         <option value="HTML + Vanilla CSS + JS">HTML + Vanilla CSS + JS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">Description / Vision</label>
                    <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Décrivez l'application ou copiez votre PRD..." className="w-full bg-slate-800/50 text-white border border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-cyan h-16 resize-none text-sm"></textarea>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">Intelligence Cible</label>
                      <select value={newProjectLogicAi} onChange={e => setNewProjectLogicAi(e.target.value)} className="bg-slate-800/50 text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-sm">
                        <option value="deepseek">🐋 DeepSeek</option>
                        <option value="openai">🟢 OpenAI (ChatGPT)</option>
                        <option value="kimi">🌙 Kimi</option>
                        <option value="gemini">✨ Gemini</option>
                        <option value="claude">🟣 Claude</option>
                      </select>
                    </div>
                    
                    <div className="mt-5">
                      <button onClick={() => setIsPrdModalOpen(true)} className="px-4 py-2 bg-indigo-900/40 border border-indigo-500/50 text-indigo-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-800 transition-colors">
                        💎 Packs PRD ({selectedPacks.length})
                      </button>
                    </div>
                    
                    <div className="mt-5">
                      <input 
                        type="file" 
                        id="trombone-creation-upload"
                        className="hidden" 
                        multiple
                        accept=".html,.md,.png,.jpg,.jpeg,.json,.txt,.zip" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) handleFileUpload(e.target.files);
                          if (e.target) e.target.value = '';
                        }} 
                      />
                      <button 
                        onClick={() => document.getElementById('trombone-creation-upload')?.click()} 
                        className="px-4 py-2 bg-pink-900/40 border border-pink-500/50 text-pink-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-pink-800 transition-colors"
                      >
                        📎 Joindre ZIP (Stitch)
                      </button>
                    </div>

                    <div className="mt-5">
                      <button 
                        onClick={() => setIsAutoPilotOn(!isAutoPilotOn)} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border ${isAutoPilotOn ? 'bg-green-900/40 border-green-500/50 text-green-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        ⚙️ AUTO-PILOT : {isAutoPilotOn ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="flex-1"></div>

                    <div className="mt-5 flex gap-2">
                      <button 
                        onClick={() => {
                          if (tromboneFiles.some(f => f.path.endsWith('.html') || f.path.endsWith('.zip'))) {
                            handleStartFullPipeline();
                          } else {
                            handleStartNewV0Project();
                          }
                        }} 
                        className="px-6 py-2.5 bg-cyan hover:bg-cyan/80 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(8,179,201,0.4)] transition-all flex items-center gap-2"
                      >
                        {tromboneFiles.some(f => f.path.endsWith('.html') || f.path.endsWith('.zip')) ? "Envoyer ZIP 🚀" : "Envoyer UI 🎨"}
                      </button>
                    </div>
                  </div>

                  {/* Structure Preview */}
                  <div className="mt-2 bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] text-slate-400 font-mono overflow-x-auto">
                    {newProjectStack.includes("Next.js") ? (
                      `📁 /app\n  📄 layout.tsx\n  📄 page.tsx\n📁 /components\n  📄 ui.tsx\n📄 tailwind.config.ts\n📄 package.json`
                    ) : newProjectStack.includes("Vite") ? (
                      `📁 /src\n  📁 /components\n  📄 App.tsx\n  📄 main.tsx\n📄 vite.config.ts\n📄 package.json`
                    ) : (
                      `📁 /\n  📄 index.html\n  📄 style.css\n  📄 script.js`
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple
                accept=".html,.md,.png,.jpg,.jpeg,.json,.txt,.zip" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handleFileUpload(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xl hover:scale-110 hover:text-cyan transition-all opacity-80 z-20 shrink-0"
                title="Joindre un fichier (Stitch/ZIP)"
              >
                📎
              </button>
              
              <button 
                onClick={() => { setActiveProject(null); setNewProjectName(""); setTromboneFiles([]); setIsCreationMode(true); }}
                className="text-cyan font-bold bg-cyan/10 hover:bg-cyan/20 px-3 py-2 rounded-full text-xs border border-cyan/30 flex items-center gap-1 transition-all shrink-0 z-20"
                title="Créer un nouveau projet"
              >
                ✨ New-v0
              </button>
              
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Demandez à Tiger IA, ou glissez un fichier HTML/ZIP..." 
                className="w-full border border-white/10 rounded-full pl-4 pr-12 py-3 md:py-4 text-white text-sm md:text-base placeholder-gray-400 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all shadow-inner"
                style={{ background: isClient ? getCachedGradient('input', 0.4) : 'rgba(255,255,255,0.05)' }}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                style={{ background: isClient ? getCachedGradient('sendbtn', 1) : '#08b3c9' }}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
