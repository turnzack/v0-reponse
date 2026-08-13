"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor from '@monaco-editor/react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Diamond, X, CheckCircle2, Box, Zap } from 'lucide-react';
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

const getTargetAiUrl = (id: string, isUi: boolean = false): string => {
  if (id === "custom") return typeof window !== 'undefined' ? (localStorage.getItem("tiger_customAiUrl") || "https://chat.deepseek.com/") : "https://chat.deepseek.com/";
  if (id === "stitch") return "https://stitch.withgoogle.com/";
  if (id === "v0") return "https://v0.dev/";
  if (id === "kimi" || id === "moonshot") return "https://www.kimi.com/fr?chat_enter_method=new_chat";
  if (id === "qwen") return "https://chat.qwen.ai/";
  if (id === "gemini") return "https://gemini.google.com/app";
  if (id === "chatgpt" || id === "openai") return "https://chatgpt.com/";
  if (id === "claude") return "https://claude.ai/";
  if (id === "perplexity") return "https://www.perplexity.ai/";
  if (id === "deepseek") return "https://chat.deepseek.com/";
  return `https://chat.${id}.com/`;
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
  const [apiProvider, setApiProvider] = useState("deepseek");
  const [apiKeyStatus, setApiKeyStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
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
    setApiProvider(localStorage.getItem("tiger_apiProvider") || "deepseek");

    // Vérifier si une clé est déjà configurée côté moteur
    const currentBridge = localStorage.getItem("tiger_bridgeUrl") || "http://127.0.0.1:5005";
    fetch(`${currentBridge}/api/config/apikey`)
      .then(r => r.json())
      .then(d => { if (d.hasAnyKey) setApiKeyStatus("ok"); })
      .catch(() => { });
  }, []);

  const handleSave = async () => {
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
    localStorage.setItem("tiger_apiProvider", apiProvider);

    // 🔑 Envoyer la clé au moteur Electron pour persistance sur disque
    if (apiKey && apiKey.trim().length > 5) {
      setApiKeyStatus("sending");
      try {
        const res = await fetch(`${bridgeUrl}/api/config/apikey`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: apiKey.trim(), provider: apiProvider }),
        });
        const data = await res.json();
        if (data.success) {
          setApiKeyStatus("ok");
          console.log(`[SETTINGS] ✅ Clé ${apiProvider} envoyée et persistée sur le moteur.`);
        } else {
          setApiKeyStatus("error");
        }
      } catch (e) {
        setApiKeyStatus("error");
        console.error("[SETTINGS] ❌ Impossible d'envoyer la clé au moteur :", e);
      }
    }

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
    { id: "connexion", label: "Connexion", icon: "⚙️" },
  ];

  return (
    <div className={`design-config-modal w-full h-screen bg-gradient-to-br from-[#845e7c]/95 to-[#6c3050]/95 backdrop-blur-2xl border-none shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col md:flex-row pointer-events-auto`}>

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
                              const url = targetAi === "custom" ? customAiUrl : getTargetAiUrl(targetAi);
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

              <div className="space-y-2">
                <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">Fournisseur API</label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className="w-full bg-gradient-to-r from-black/40 to-black/60 text-white border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-pink text-sm"
                >
                  <option value="deepseek">🐋 DeepSeek</option>
                  <option value="openai">🟢 OpenAI (ChatGPT)</option>
                  <option value="anthropic">🟣 Anthropic Claude</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                  Clé API
                  {apiKeyStatus === "ok" && <span className="text-green-400 text-[10px] font-bold bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/30">✅ Persistante sur disque</span>}
                  {apiKeyStatus === "sending" && <span className="text-yellow-400 text-[10px] animate-pulse">⏳ Envoi...</span>}
                  {apiKeyStatus === "error" && <span className="text-red-400 text-[10px]">❌ Erreur moteur</span>}
                </label>
                <div className="flex gap-2 relative">
                  <input
                    type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className={`flex-1 bg-gradient-to-r from-black/40 to-black/60 text-white border rounded-xl px-4 py-3 outline-none text-sm font-mono transition-colors ${apiKeyStatus === "ok" ? "border-green-500/50 focus:border-green-400" :
                        apiKeyStatus === "error" ? "border-red-500/50" :
                          "border-white/20 focus:border-pink"
                      }`}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-cyan/20 hover:bg-cyan/40 border border-cyan/40 text-cyan rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                  >
                    💾 SAUVEGARDER + ENVOYER AU MOTEUR
                  </button>
                  <span className="text-gray-500 text-xs italic">Persistée sur disque (reste après redémarrage).</span>
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

          {activeTab === "home" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-cyan">🐯</span> TIGER IA — Hub d'Orchestration Souverain
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Supervision de l'écosystème Zero-Touch et de l'orchestrateur G5.</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold animate-pulse">
                  ● Moteur IA Actif
                </span>
              </div>

              {/* Grid des Cartes de Statut */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-black/40 to-black/70 p-4 rounded-2xl border border-cyan/30 shadow-lg">
                  <div className="text-cyan text-xs font-bold uppercase tracking-wider mb-1">Moteur Local</div>
                  <div className="text-2xl font-black text-white">v5.0.0</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan"></span> Bridge 5005 Opérationnel
                  </div>
                </div>

                <div className="bg-gradient-to-br from-black/40 to-black/70 p-4 rounded-2xl border border-purple-500/30 shadow-lg">
                  <div className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">Agent Réflexion</div>
                  <div className="text-2xl font-black text-white">DeepSeek-R1</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> Mode Hybride Actif
                  </div>
                </div>

                <div className="bg-gradient-to-br from-black/40 to-black/70 p-4 rounded-2xl border border-pink/30 shadow-lg">
                  <div className="text-pink text-xs font-bold uppercase tracking-wider mb-1">Studio UI/UX</div>
                  <div className="text-2xl font-black text-white">Zero-Touch</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink"></span> Synchro Temps Réel
                  </div>
                </div>
              </div>

              {/* Actions Rapides */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">🚀 Actions Système Rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => window.open('http://localhost:3005', '_blank')}
                    className="p-4 bg-gradient-to-r from-cyan/20 to-blue-500/20 hover:from-cyan/30 hover:to-blue-500/30 border border-cyan/40 rounded-xl text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-white font-bold text-sm group-hover:text-cyan transition-colors">🌐 Ouvrir l'Interface Studio (Vercel)</div>
                      <div className="text-xs text-gray-400">Accès direct au tableau de bord localhost:3005</div>
                    </div>
                    <span className="text-xl">➔</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("http://localhost:5005/api/theme");
                        const data = await res.json();
                        alert("Thème synchronisé : " + (data.activeTheme?.nom || "Thème par défaut"));
                      } catch (e) {
                        alert("Vérifiez que le serveur Electron :5005 est démarré.");
                      }
                    }}
                    className="p-4 bg-gradient-to-r from-purple-500/20 to-pink/20 hover:from-purple-500/30 hover:to-pink/30 border border-purple-500/40 rounded-xl text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-white font-bold text-sm group-hover:text-purple-300 transition-colors">🎨 Tester la Synchronisation Thème</div>
                      <div className="text-xs text-gray-400">Interroge l'API bridge :5005/api/theme</div>
                    </div>
                    <span className="text-xl">🔄</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "electron" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-cyan">💻</span> Moteur Electron PC — Serveur Local
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Gestion du pont d'exécution et du système de fichiers local.</p>
                </div>
                <span className="px-3 py-1 bg-cyan/20 text-cyan border border-cyan/40 rounded-full text-xs font-bold">
                  Port :5005
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Dossier Racine Workspace :</span>
                    <span className="text-cyan font-bold">E:\v0reponses</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Répertoire des Projets Sauvegardés :</span>
                    <span className="text-green-400 font-bold">v0-moteur-electron/v0saveprojets</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Fichier Configuration Thème :</span>
                    <span className="text-yellow-400 font-bold">theme-config.json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode Bridge HTTP :</span>
                    <span className="text-blue-400 font-bold">Express API REST Active</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("http://localhost:5005/api/projects");
                        const data = await res.json();
                        alert(`Projets détectés (${data.projects?.length || 0}) : \n` + (data.projects?.join('\n') || 'Aucun'));
                      } catch (e) {
                        alert("Erreur de connexion au bridge Express :5005");
                      }
                    }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    📁 Lister les Projets Locaux
                  </button>

                  <button
                    onClick={() => {
                      alert("Le moteur Electron tourne sur la tâche principale Windows.");
                    }}
                    className="flex-1 py-3 bg-cyan/20 hover:bg-cyan/30 border border-cyan/40 rounded-xl text-cyan font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    ⚡ État du Processus Electron
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "vercel" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-pink">▲</span> Studio Web Vercel — Preview & HMR
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Interface frontend réactive et synchronisation en direct.</p>
                </div>
                <span className="px-3 py-1 bg-pink/20 text-pink border border-pink/40 rounded-full text-xs font-bold">
                  Vite Dev Server
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-3 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">URL Dev Local :</span>
                    <span className="text-cyan font-mono font-bold">http://localhost:3005</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Design System CSS :</span>
                    <span className="text-pink font-mono font-bold">src/design.css</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Source de Vérité Design Tokens :</span>
                    <span className="text-purple-400 font-mono font-bold">src/design-tokens.json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hot Module Replacement (HMR) :</span>
                    <span className="text-green-400 font-bold">Actif (Modifications Instantanées)</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.open('http://localhost:3005/admin-design', '_blank')}
                    className="flex-1 py-3 bg-gradient-to-r from-pink/30 to-purple-500/30 hover:from-pink/40 hover:to-purple-500/40 border border-pink/50 rounded-xl text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    🎨 Ouvrir le Studio Admin Design
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deepseek" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-purple-400">🐋</span> Modèle IA DeepSeek — Agent Logique
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Paramètres du modèle de génération de code et d'architecture.</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold">
                  DeepSeek-V3 / R1
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-3 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Mode d'Exécution IA :</span>
                    <span className="text-cyan font-bold">Chat Web & API Hybride</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Fenêtre de Contexte :</span>
                    <span className="text-green-400 font-bold">128,000 Tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rôle Principal :</span>
                    <span className="text-purple-400 font-bold">Cerveau Backend & Génération de Fichiers</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.open('https://chat.deepseek.com/', '_blank')}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500/30 to-blue-500/30 hover:from-purple-500/40 hover:to-blue-500/40 border border-purple-500/40 rounded-xl text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    🐋 Ouvrir DeepSeek Web
                  </button>
                </div>
              </div>
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

const Carousel = ({ items }: { items: React.ReactNode[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="design-carte-carrousel-conteneur w-full max-w-full flex overflow-x-auto gap-4 py-24 px-28 -my-20 hide-scrollbar scroll-smooth relative"
      style={{ scrollBehavior: 'smooth' }}
    >
      {items.map((item, idx) => (
        <div key={idx} className="shrink-0 relative z-0 hover:z-50">
          {item}
        </div>
      ))}
    </div>
  );
};

const LOCAL_PRD_READMES = import.meta.glob('../../prd_packs/*/README.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const getLocalPackReadme = (packId: string): string | null => {
  for (const pathKey in LOCAL_PRD_READMES) {
    if (pathKey.includes(`/${packId}/README.md`) || pathKey.includes(`\\${packId}\\README.md`)) {
      return LOCAL_PRD_READMES[pathKey];
    }
  }
  return null;
};

const WidgetPrdPacks = ({
  selectedPacks,
  togglePack,
  isClient,
  getCachedGradient,
  onDetailStateChange
}: any) => {
  const [packReadmes, setPackReadmes] = useState<{ [id: string]: string }>({});
  const [selectedPrdDetail, setSelectedPrdDetail] = useState<{ packId: string, packName: string, readmeText: string } | null>(null);

  const handleSetSelectedPrdDetail = (detail: { packId: string, packName: string, readmeText: string } | null) => {
    setSelectedPrdDetail(detail);
    if (onDetailStateChange) {
      onDetailStateChange(!!detail);
    }
  };

  useEffect(() => {
    AVAILABLE_PACKS.forEach((pack: any) => {
      const packId = pack.id;
      if (!packReadmes[packId]) {
        const localContent = getLocalPackReadme(packId);
        if (localContent) {
          setPackReadmes(prev => ({ ...prev, [packId]: localContent }));
        }
      }
    });
  }, []);

  // 1. Vue détaillée de l'article README quand sélectionné
  if (selectedPrdDetail) {
    const fullReadme = packReadmes[selectedPrdDetail.packId] || getLocalPackReadme(selectedPrdDetail.packId) || selectedPrdDetail.readmeText;

    return (
      <div className="design-fenetre-readme w-full backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-4 relative animate-fadeIn text-white" style={{ background: isClient ? getCachedGradient('prd-detail-' + selectedPrdDetail.packId, 0.9) : 'rgba(0,0,0,0.9)' }}>
        <button
          onClick={() => handleSetSelectedPrdDetail(null)}
          className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold transition-colors z-20"
          title="Fermer"
        >
          ✕
        </button>

        <span className="px-3 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-md mb-4 inline-block border border-cyan/30">💎 PACK PRD : {selectedPrdDetail.packId}</span>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">{selectedPrdDetail.packName}</h2>

        <div className="w-full h-px bg-white/10 mb-6"></div>

        {/* DOCUMENTATION README COMPLÈTE */}
        <div className="design-readme-contenu text-gray-100 leading-relaxed whitespace-pre-line overflow-y-auto hide-scrollbar bg-black/40 p-6 rounded-2xl border border-white/10 font-mono">
          {fullReadme}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-cyan font-mono font-bold tracking-widest uppercase">CONTRAT SUTURE ARCHITECTURE</span>
          <button
            onClick={() => handleSetSelectedPrdDetail(null)}
            className="px-6 py-3 bg-white/5 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 hover:border-cyan"
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // Fetch Guest Packs
  const [guestPacks, setGuestPacks] = useState<any[]>([]);
  const [showGuestPacks, setShowGuestPacks] = useState(false);

  const fetchGuestPacks = async () => {
    try {
      const res = await fetch("http://localhost:5005/api/bridge/list-guest-packs");
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        if (data.success && data.packs) {
          setGuestPacks(data.packs);
        }
      }
    } catch (e) {
      console.error("Erreur lecture guest packs", e);
    }
  };

  useEffect(() => {
    fetchGuestPacks();
  }, []);

  // 2. Vue Carrousel de TOUS les Packs PRD sur la Page d'Accueil
  return (
    <div id="prd-packs-carousel-section" className="w-full my-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <h4 className="design-prd-titre-section font-black uppercase tracking-widest text-cyan flex items-center gap-2">
          <span>💎</span> PACKS PRD DE CONNAISSANCES ({AVAILABLE_PACKS.length})
        </h4>
        {selectedPacks && selectedPacks.length > 0 && (
          <span className="text-[11px] font-bold text-cyan bg-cyan/20 px-2.5 py-1 rounded-full border border-cyan/30">
            {selectedPacks.length} pack(s) actif(s)
          </span>
        )}
      </div>

      <div className="flex gap-4 items-stretch relative">
        {/* CARTE JOKER (FIXE À GAUCHE) */}
        <div className="w-[280px] flex-shrink-0 z-20 py-24 -my-20">
          <div 
            onClick={() => setShowGuestPacks(!showGuestPacks)}
            className={`h-full rounded-2xl p-6 border flex flex-col justify-between transition-all cursor-pointer shadow-2xl relative overflow-hidden group ${
              showGuestPacks 
                ? 'border-purple-400 bg-purple-950/40 shadow-[0_0_30px_rgba(168,85,247,0.3)]' 
                : 'border-white/10 bg-black/60 hover:border-purple-500/50 hover:bg-purple-950/20'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🐋</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2 leading-tight">V0-GUEST</h3>
              <div className="text-purple-400 font-bold text-sm uppercase tracking-widest mb-3">Hermes PRD Pack Engine</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accédez à vos propres packs sur-mesure générés localement par reverse engineering avec l'Agent Hermes.
              </p>
            </div>
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                {guestPacks.length} PACKS DISPONIBLES
              </span>
              <span className={`text-xl transition-transform ${showGuestPacks ? 'rotate-90 text-purple-400' : 'text-zinc-500 group-hover:text-purple-400'}`}>➔</span>
            </div>
          </div>
        </div>

        {/* CARROUSEL PRINCIPAL V.0.1.0 */}
        <div className="flex-1 overflow-hidden">
          <Carousel items={AVAILABLE_PACKS.map((pack: any) => {
            const packId = pack.id;
            const packName = pack.name;
            const Icon = pack.icon || Box;
            const isSelected = selectedPacks ? selectedPacks.includes(packId) : false;
            const readmeText = packReadmes[packId] || getLocalPackReadme(packId) || "Spécifications techniques du contrat PRD.";
            let cleanSummary = readmeText
              .replace(/^#+.*$/gm, '')
              .replace(/^>.*$/gm, '')
              .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
              .replace(/[*_~`]/g, '')
              .trim();
            
            const paragraphs = cleanSummary.split('\n').map(p => p.trim()).filter(p => p.length > 20);
            const firstParagraph = paragraphs.length > 0 ? paragraphs[0] : "Spécifications techniques du contrat PRD.";
            const shortDesc = firstParagraph.length > 180 ? (firstParagraph.substring(0, 180) + "...") : firstParagraph;

            return (
              <div
                key={packId}
                className={`design-carte-carrousel design-prd-carte rounded-2xl p-5 border backdrop-blur-md flex flex-col transition-all shadow-lg relative group ${isSelected ? 'border-cyan shadow-[0_0_25px_rgba(8,179,201,0.4)]' : 'border-white/10 hover:border-cyan/50'}`}
                style={{ background: isClient ? getCachedGradient('prd-card-' + packId, 0.7) : 'rgba(0,0,0,0.7)' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-cyan text-black shadow-md' : (pack.color || 'bg-cyan/20 text-cyan')}`}>
                      <Icon size={20} />
                    </div>
                    <span className="px-2 py-0.5 bg-cyan/20 text-cyan text-[10px] font-bold rounded-md uppercase tracking-wider">💎 PRD</span>
                  </div>
                  {togglePack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePack(packId);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-cyan text-black shadow-md scale-110' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
                      title={isSelected ? "Désélectionner ce pack" : "Sélectionner ce pack pour l'IA"}
                    >
                      {isSelected ? '✓' : '+'}
                    </button>
                  )}
                </div>

                <h3 className="design-carte-titre text-base font-bold text-white mb-2 leading-tight">{packName}</h3>
                <p className="design-carte-desc flex-1 opacity-85 leading-relaxed">{shortDesc}</p>

                <button
                  onClick={() => handleSetSelectedPrdDetail({ packId, packName, readmeText })}
                  className="design-prd-btn text-cyan text-xs font-bold hover:underline self-end cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan/30 transition-all"
                >
                  <span>📖</span> Lire le README →
                </button>
              </div>
            );
          })} />
        </div>
      </div>

      {/* CARROUSEL DES PACKS GUEST (AFFICHE SI JOKER SELECTIONNE) */}
      {showGuestPacks && (
        <div className="mt-8 pt-6 border-t border-purple-500/20 animate-fadeIn">
          <div className="flex items-center justify-between mb-3 px-2">
            <h4 className="design-prd-titre-section font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
              <span>🐋</span> MES PACKS GUEST GÉNÉRÉS PAR HERMES ({guestPacks.length})
            </h4>
            <button onClick={fetchGuestPacks} className="text-[10px] text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full hover:bg-purple-900/30 transition-colors">
              Actualiser
            </button>
          </div>
          
          {guestPacks.length === 0 ? (
            <div className="p-8 text-center border border-purple-500/20 rounded-2xl bg-purple-950/10">
              <p className="text-purple-300 text-sm">Aucun pack Guest n'a encore été généré.</p>
              <p className="text-xs text-zinc-500 mt-2">Utilisez l'interface V0-GUEST pour scanner un projet local et créer un pack.</p>
            </div>
          ) : (
            <Carousel items={guestPacks.map((pack: any) => {
              const packId = pack.id;
              const isSelected = selectedPacks ? selectedPacks.includes(packId) : false;
              
              return (
                <div
                  key={packId}
                  className={`design-carte-carrousel design-prd-carte rounded-2xl p-5 border backdrop-blur-md flex flex-col transition-all shadow-lg relative group ${isSelected ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)] bg-purple-950/60' : 'border-purple-500/20 hover:border-purple-400/60 bg-black/50'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'}`}>
                        <Zap size={18} />
                      </div>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-md uppercase tracking-wider border border-purple-500/30">🐋 GUEST</span>
                    </div>
                    {togglePack && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePack(packId);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-purple-500 text-white shadow-md scale-110' : 'bg-white/10 text-white/60 hover:bg-purple-500/40 hover:text-white'}`}
                      >
                        {isSelected ? '✓' : '+'}
                      </button>
                    )}
                  </div>

                  <h3 className="design-carte-titre text-base font-bold text-white mb-2 leading-tight truncate">{pack.name}</h3>
                  <p className="design-carte-desc flex-1 opacity-85 leading-relaxed text-zinc-300 text-xs line-clamp-4">
                    {pack.description}
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-400/80">{pack.modulesCount} MODULES</span>
                    <button
                      onClick={async () => {
                        // Charger le README dynamique depuis le bridge
                        try {
                          const res = await fetch(`http://localhost:5005/api/bridge/read-file?path=${encodeURIComponent(pack.path + '/README.md')}`);
                          if (res.ok) {
                            const data = await res.json();
                            const content = data.data?.content || data.content;
                            if (content) {
                              handleSetSelectedPrdDetail({ packId, packName: pack.name, readmeText: content });
                            }
                          }
                        } catch (e) {
                          console.error('Erreur chargement README', e);
                        }
                      }}
                      className="design-prd-btn text-purple-300 text-[11px] font-bold hover:text-white cursor-pointer transition-all bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-500/40 hover:bg-purple-500/40"
                    >
                      Détails →
                    </button>
                  </div>
                </div>
              );
            })} />
          )}
        </div>
      )}
    </div>
  );
};

const WidgetProjects = ({ isClient, getCachedGradient, setActiveProject }: any) => {
  const [liveProjects, setLiveProjects] = useState<{ name: string, desc: string, bg: string }[]>([]);
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

  return <Carousel items={[
    ...liveProjects.map((p, i) => {
      const handleOpenProject = async () => {
        setActiveProject(p.name);
        try {
          window.dispatchEvent(new CustomEvent('open-mouchard'));
          fetch("http://localhost:5005/api/bridge/launch-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: p.name })
          }).catch(err => console.error("Erreur de lancement :", err));
        } catch (err: any) {
          console.error("Erreur de lancement :", err);
        }
      };

      return (
        <div
          key={i}
          className={`design-carte-carrousel rounded-2xl p-5 border border-white/20 shadow-xl flex flex-col items-center text-center relative overflow-hidden group cursor-pointer`}
          style={{ background: isClient ? getCachedGradient('proj-' + i, 0.7) : 'rgba(0,0,0,0.5)' }}
          onClick={handleOpenProject}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-0" />
          <div className="z-10 relative pointer-events-none w-full">
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest drop-shadow-md">PROJET</div>
            <h3 className="design-carte-titre text-xl font-black text-white break-all drop-shadow-lg leading-tight w-full">{p.name}</h3>
          </div>
          <div className="design-carte-desc z-10 relative text-sm text-white/90 font-medium drop-shadow-md pointer-events-none w-full">{p.desc}</div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProject();
            }}
            className="z-10 bg-white/20 hover:bg-white/40 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors mt-2"
            title="Ouvrir le projet, vérifier les dépendances et lancer l'aperçu"
          >
            🚀 Ouvrir & Designer
          </button>
        </div>
      );
    })]} />
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Simulation des phases de création
  const [activePhase, setActivePhase] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isMobileNative, setIsMobileNative] = useState(false);
  const [isPrdDetailOpen, setIsPrdDetailOpen] = useState(false);

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
  const [mouchardLogs, setMouchardLogs] = useState<string[]>(["> Système Kirov5 initialisé. " + new Date().toLocaleTimeString()]);
  const [realProjects, setRealProjects] = useState<{ name: string, desc: string, bg: string }[]>([]);

  // --- ETAT : PACKS PRD SELECTIONNES & VISIBILITE CARROUSEL ---
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [showPacksCarousel, setShowPacksCarousel] = useState(false);
  const [packSearchQuery, setPackSearchQuery] = useState("");

  // MODAL NOUVEAU PROJET V0 -> CREATION MODE INLINE
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStack, setNewProjectStack] = useState("Vite + React + Tailwind + TS");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectLogicAi, setNewProjectLogicAi] = useState("deepseek");
  const [newProjectInstructions, setNewProjectInstructions] = useState("");
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [isLocalZipMode, setIsLocalZipMode] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // --- ETAT : COMPILATEUR APK MOBILE (v0-apk) ---
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [apkBuildStatus, setApkBuildStatus] = useState<"idle" | "building" | "success" | "error">("idle");
  const [apkLogs, setApkLogs] = useState<string[]>([]);
  const [selectedApkTarget, setSelectedApkTarget] = useState<string>("");
  const [apkOutputUrl, setApkOutputUrl] = useState<string | null>(null);


  // --- WIDGET NEWS (LIVE API & FALLBACK RAPIDE) ---
  const [liveNewsData, setLiveNewsData] = useState<any[]>([]);
  const [isFetchingNews, setIsFetchingNews] = useState(false);

  const fetchLiveNews = useCallback(async (apiKey?: string) => {
    setIsFetchingNews(true);

    const defaultNews = [
      {
        id: "deepseek-r1-v0",
        tag: "⚡ DEEPSEEK R1",
        title: "DeepSeek-R1 & Moteur Souverain v0.1",
        desc: "Capacités de raisonnement avancé et de suture pour interfaces React.",
        content: "DeepSeek-R1 offre des capacités de raisonnement avancé pour l'analyse de contrats PRD et la génération zéro-touch de projets web complets.\n\nPoints clés :\n- Extraction automatique des variables CSS :root\n- Injection dynamique des packs d'architecture PRD\n- Synchronisation HMR ultra-rapide avec Electron."
      },
      {
        id: "sovereign-ide-2026",
        tag: "🚀 SOUVEREIGN OS",
        title: "IDE Code 2026 : Passerelle Electron Local & Mobile Native",
        desc: "Nouvelle mise à jour du bridge local :5005 et support Android Capacitor.",
        content: "La version v0.1.0 de l'OS Souverain intègre une passerelle universelle Electron & Capacitor.\n\nPoints forts :\n- Exécution en arrière-plan des pipelines Trombone\n- Sauvegarde directe dans le workspace local\n- Studio de retouche visuelle en Split-View instantané."
      },
      {
        id: "prd-packs-v14",
        tag: "💎 PACKS PRD",
        title: "64 Packs PRD d'Architecture en Carrousel",
        desc: "Directeurs de code pour E-Commerce, Auth Gateway, SaaS Billing...",
        content: "Les contrats d'interfaces PRD (Product Requirements Documents) s'activent directement depuis le carrousel principal.\n\nUtilisation :\n1. Sélection des packs d'architecture\n2. Consultation du README en direct dans le carrousel\n3. Création du projet et câblage avec Stitch."
      }
    ];

    try {
      const keyToUse = apiKey || localStorage.getItem("tiger_apiKey");
      if (!keyToUse || !keyToUse.startsWith("sk-") || keyToUse.length < 20) {
        setLiveNewsData(defaultNews);
        setIsFetchingNews(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyToUse}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Tu es le fil d'actualités technologiques de l'OS Souverain. Réponds UNIQUEMENT en JSON avec une clé 'news' contenant 3 articles récents au format [{id, tag, title, desc, content}]." },
            { role: "user", content: "Donne 3 actualités récentes sur l'IA et le développement web." }
          ],
          response_format: { type: "json_object" }
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed.news && Array.isArray(parsed.news) && parsed.news.length > 0) {
          setLiveNewsData(parsed.news);
        } else {
          setLiveNewsData(defaultNews);
        }
      } else {
        setLiveNewsData(defaultNews);
      }
    } catch (err) {
      console.warn("[Actualités] Erreur ou Timeout API DeepSeek, chargement fallback:", err);
      setLiveNewsData(defaultNews);
    } finally {
      setIsFetchingNews(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveNews();
  }, [fetchLiveNews]);


  // --- WIDGET THEMES COLOR SAVER ---
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("random");
  const [savedThemes, setSavedThemes] = useState<{ name: string, colors: Record<string, string> }[]>([]);
  const [newThemeName, setNewThemeName] = useState("");

  useEffect(() => {
    const loaded = localStorage.getItem("tiger_saved_themes");

    if (loaded) {
      try {
        let parsed = JSON.parse(loaded);
        const defaultBg = "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #000000 100%)";
        parsed = parsed.map((t: any) => t.name === "fold" && !t.colors["bg-app"] ? { ...t, colors: { ...t.colors, "bg-app": defaultBg } } : t);
        setSavedThemes(parsed);
      } catch (e) { }
    } else {
      // "fold" default theme from screenshot
      const defaultTheme = {
        name: "fold",
        colors: {
          "icon-settings": "linear-gradient(135deg, #c87058, #934a36)",
          "icon-ai": "linear-gradient(135deg, #9d508e, #622e5a)",
          "icon-projects": "linear-gradient(135deg, #d38b5d, #a26038)",
          "icon-packs": "linear-gradient(135deg, #445499, #252e66)",
          "icon-news": "linear-gradient(135deg, #389eb2, #1f6475)",
          "bg-app": "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #000000 100%)"
        }
      };
      setSavedThemes([defaultTheme]);
      localStorage.setItem("tiger_saved_themes", JSON.stringify([defaultTheme]));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tiger_active_theme", activeTheme);
    if (activeTheme !== "random") {
      const bg = savedThemes.find(t => t.name === activeTheme)?.colors["bg-app"] || "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #000000 100%)";
      document.body.style.background = bg;
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.background = "";
    }
  }, [activeTheme, savedThemes]);

  const getIconStyle = (iconId: string) => {
    if (activeTheme === "random") {
      return isClient ? getCachedGradient(iconId, 0.8) : 'rgba(50,50,50,0.8)';
    }
    const theme = savedThemes.find(t => t.name === activeTheme);
    return theme && theme.colors[iconId] ? theme.colors[iconId] : (isClient ? getCachedGradient(iconId, 0.8) : 'rgba(50,50,50,0.8)');
  };

  const saveCurrentTheme = () => {
    if (!newThemeName.trim()) return alert("Nom invalide");
    if (savedThemes.length >= 10) return alert("Limite atteinte ! Vous ne pouvez sauvegarder que 10 thèmes maximum. Veuillez en supprimer un pour continuer.");

    // On capture depuis le cache de getCachedGradient
    const newColors = {
      "icon-settings": getCachedGradient("icon-settings", 0.8),
      "icon-ai": getCachedGradient("icon-ai", 0.8),
      "icon-projects": getCachedGradient("icon-projects", 0.8),
      "icon-packs": getCachedGradient("icon-packs", 0.8),
      "icon-news": getCachedGradient("icon-news", 0.8),
      "bg-app": getCachedGradient("bg-app", 0.9)
    };

    const newTheme = { name: newThemeName.trim(), colors: newColors };
    const newSaved = [...savedThemes, newTheme];
    setSavedThemes(newSaved);
    localStorage.setItem("tiger_saved_themes", JSON.stringify(newSaved));
    setActiveTheme(newTheme.name);
    setNewThemeName("");
  };

  const deleteTheme = (themeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = savedThemes.filter(t => t.name !== themeName);
    setSavedThemes(newSaved);
    localStorage.setItem("tiger_saved_themes", JSON.stringify(newSaved));
    if (activeTheme === themeName) setActiveTheme("random");
  };

  const togglePack = (packId: string) => {
    setSelectedPacks(prev => prev.includes(packId) ? prev.filter(id => id !== packId) : [...prev, packId]);
  };
  const [selectedStartPhase, setSelectedStartPhase] = useState<number>(0); // 0 = TOUT
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(true);
  const [reuseActiveTab, setReuseActiveTab] = useState<boolean>(true);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [fsTree, setFsTree] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [tromboneFiles, setTromboneFiles] = useState<{ path: string, content: string }[]>([]);

  // Fetch initial project list
  useEffect(() => {
    fetch("http://localhost:5005/api/projects")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.projects)) {
          setRealProjects(data.projects.map((p: string) => ({ name: p, desc: "Projet local", bg: "" })));
        }
      })
      .catch(() => { });
  }, []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewInput, setPreviewInput] = useState<string>("");
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [isIdeFullscreen, setIsIdeFullscreen] = useState(false);

  const lastPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    lastPreviewUrlRef.current = null;
    if (activeProject === 'v0-guest' || activeProject === 'V0-Guest') {
      setIsIdeFullscreen(true);
      setPreviewUrl("http://localhost:3007");
      lastPreviewUrlRef.current = "http://localhost:3007";
    } else if (activeProject) {
      setIsIdeFullscreen(true);
      setPreviewUrl(null);
    } else {
      setIsIdeFullscreen(false);
      setPreviewUrl(null);
    }
  }, [activeProject]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CHANGE_PREVIEW_URL') {
        const route = event.data.route;
        const hashRoute = route === '/' ? '' : `#${route}`;
        setPreviewUrl(currentUrl => {
          const baseUrl = currentUrl ? currentUrl.split('#')[0] : 'http://localhost:5173/';
          const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
          return `${cleanBase}${hashRoute}`;
        });
      }

      if (event.data?.type === 'DESIGN_ELEMENT_CLICKED' || event.data?.type === 'DESIGN_ELEMENT_DRAGGED' || event.data?.type === 'DESIGN_ELEMENT_RESIZED') {
        // Relayer le message au Studio Admin Design
        const adminIframe = document.querySelector('iframe[title="Studio Admin Design"]') as HTMLIFrameElement;
        if (adminIframe && adminIframe.contentWindow) {
          adminIframe.contentWindow.postMessage(event.data, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Chargement de l'arborescence quand un projet est actif
  useEffect(() => {
    if (activeProject) {
      fetch(`http://localhost:5005/api/fs/tree?project=${activeProject}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFsTree(data.tree);
        }).catch(() => { });
    }
  }, [activeProject]);

  // Chargement du contenu du fichier sélectionné
  useEffect(() => {
    if (activeProject && activeFile) {
      fetch(`http://localhost:5005/api/fs/read?project=${activeProject}&file=${encodeURIComponent(activeFile)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFileContent(data.content);
        }).catch(() => { });
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
      }).catch(() => { });
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
      }).catch(() => { });
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
          }).catch(() => { });
      }
    };
    loadProjects();
  }, []);

  // Chargement de l'historique
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

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
            const serverReadyLog = [...data.logs].reverse().find((log: string) => log.includes("URL_PREVIEW="));
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
        .catch(() => { });
    }, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };







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
        const newProjectId = activeProject || (newProjectName.trim() ? newProjectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : ("Projet_" + textToSend.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4)));
        setActiveProject(newProjectId);
        if (typeof window !== 'undefined') localStorage.setItem("tiger_lastGeneratedProject", newProjectId);

        if (typeof window !== "undefined") {
          const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
          const uiAi = localStorage.getItem("tiger_targetUiAi") || "stitch";

          const getUrl = (id: string, isUi: boolean = false) => getTargetAiUrl(id, isUi);

          // Lancement réel via le Bridge Android (WebView Fantôme) ou Electron
          const bridge = (window as any).AndroidBridge;
          if (bridge && bridge.openAIWithPrompt) {
            // 📱 MOTEUR MOBILE : On lance Stitch d'abord. DeepSeek sera lancé après le Trombone.
            bridge.openAIWithPrompt(getUrl(uiAi, true), "Génère l'interface UI/UX complète et moderne pour ce projet : " + textToSend);
            if (bridge.showToast) bridge.showToast("Stitch s'ouvre. Générez le HTML, puis utilisez le Trombone.");
          } else {
            // 💻 MOTEUR PC : Fallback pour navigateur standard / Electron (Multifenêtrage)
            const packsDetailsText = (selectedPacks && selectedPacks.length > 0)
              ? `\n\n[PACKS PRD ARCHITECTURE SELECTIONNES (${selectedPacks.length})]\n` + selectedPacks.map(id => {
                const pk = AVAILABLE_PACKS.find(p => p.id === id);
                return `• ${pk ? pk.name : id} (#${id})`;
              }).join('\n')
              : "";

            const uiPromptText = "Génère l'interface UI/UX complète et moderne pour ce projet : " + textToSend + packsDetailsText;
            try {
              if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(uiPromptText);
              }
            } catch (e) { }

            // On envoie le prompt UI au Bridge
            const sendUiPrompt = () => {
              return fetch("http://localhost:5005/bridge/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  target_ai: uiAi,
                  prompt: uiPromptText,
                  auto_submit: true,
                  project_id: newProjectId,
                  phase_num: 1,
                  packs: selectedPacks
                })
              });
            };

            if (selectedStartPhase !== 200) {
              if (!reuseActiveTab) {
                window.open(getUrl(uiAi, true), "_blank");
              } else {
                window.open(getUrl(uiAi, true), "kirov5_ai_target");
              }
              sendUiPrompt().then(() => {
                console.log("Prompt UI envoyé avec succès au Bridge pour Stitch !");
              }).catch((e) => console.error("Erreur sendUiPrompt", e));
            }

            // On envoie le prompt Logique au Bridge avec un léger décalage réseau
            setTimeout(() => {
              const logicPromptText = (selectedPacks && selectedPacks.length > 0)
                ? textToSend + packsDetailsText
                : "L'interface UI/UX est actuellement en cours de génération. Prépare la structure backend et les états React pour un projet complexe : " + textToSend + ". Reste en attente, je te fournirai le fichier HTML pour le câblage final.";

              try {
                if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(logicPromptText);
                }
              } catch (e) { }

              window.open(getUrl(logicAi), "_blank");

              // Envoi systématique au Bridge pour l'extension et le moteur local
              fetch("http://localhost:5005/bridge/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  target_ai: logicAi,
                  prompt: logicPromptText,
                  auto_submit: true,
                  project_id: newProjectId,
                  phase_num: 1,
                  packs: selectedPacks
                })
              }).catch(err => console.log("Erreur Bridge Logic Prompt:", err));

              if (selectedPacks && selectedPacks.length > 0) {
                // TROMBONE PIPELINE (PRD)
                fetch("http://localhost:5005/api/bridge/trombone", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: logicAi,
                    user_prompt: logicPromptText,
                    packs: selectedPacks,
                    target_project: newProjectId
                  })
                }).then(() => {
                  console.log("Méga-Prompt Trombone envoyé !");
                }).catch(err => {
                  console.log("Erreur Trombone Bridge:", err);
                });
              } else {
                // STANDARD PIPELINE
                fetch("http://localhost:5005/bridge/prompt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    target_ai: logicAi,
                    prompt: logicPromptText,
                    auto_submit: true,
                    project_id: newProjectId,
                    phase_num: 1
                  })
                }).then(() => {
                  console.log("Prompt Logique envoyé au Bridge");
                }).catch(() => { });
              }
            }, 800);

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
      } else if (normalizedInput.includes("actualite") || normalizedInput.includes("ia") || normalizedInput.includes("news") || normalizedInput.includes("recherche")) {
        const currentApiKey = localStorage.getItem("tiger_apiKey");
        responseMsg.content = "Actualités & Dernières Innovations IA :";
        responseMsg.widget = "news";
        fetchLiveNews(currentApiKey || undefined);
      } else if (normalizedInput.includes("parametre") || normalizedInput.includes("reglage") || normalizedInput.includes("configuration") || normalizedInput.includes("setting")) {
        responseMsg.content = "Ouverture du panneau de configuration système :";
        responseMsg.widget = "settings";

      } else if (
        normalizedInput.includes("[plugin:vite:") ||
        normalizedInput.includes("missing semicolon") ||
        normalizedInput.includes("syntaxerror") ||
        normalizedInput.includes("typescriptparsermixin") ||
        normalizedInput.includes("babel/parser") ||
        (normalizedInput.includes("error") && normalizedInput.length > 80)
      ) {
        const targetProj = activeProject || "Projet_blog_8831";
        responseMsg.content = `🚨 Trace d'erreur détectée !\n\nLancement immédiat de l'Auto-Suture IA pour le projet "${targetProj}" avec la stack trace fournie... 🩺`;
        handleIDEAction("suture", textToSend);
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
    const getUrl = (id: string, isUi: boolean = false) => getTargetAiUrl(id, isUi);

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

    if (selectedStartPhase !== 200 && !reuseActiveTab) {
      sendUiPrompt().then(() => {
        console.log("Prompt UI envoyé au Bridge");
        window.open(getUrl(uiAi, true), "_blank");
      }).catch(() => {
        window.open(getUrl(uiAi, true), "_blank");
      });
    }
  };

  const handleStartLocalZipPipeline = () => {
    const designProjectId = activeProject || (newProjectName.trim()
      ? "Projet_" + newProjectName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4)
      : "Projet_Local_ZIP_" + Date.now().toString().slice(-4));

    if (!activeProject) {
      setActiveProject(designProjectId);
    }

    fetch("http://localhost:5005/api/bridge/trombone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zip_mode: true,
        target_ai: newProjectLogicAi,
        target_project: designProjectId,
        start_phase: selectedStartPhase === 0 ? 1 : selectedStartPhase,
        auto_pilot: isAutoPilot,
        force_restart: true,
        user_prompt: newProjectName.trim() ? `${newProjectName} - ${newProjectDesc}` : "Application basée sur ZIP local"
      })
    }).then(async res => {
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + "_hermes",
          role: "assistant",
          content: `✅ ${data.message}\n\n📡 Lot ${data.current_batch || (selectedStartPhase === 0 ? 1 : selectedStartPhase)}/${data.total_batches} transmis à ${newProjectLogicAi.toUpperCase()}.\n⚙️ AutoPilot: ${isAutoPilot ? 'ACTIVÉ 🟢 (Lancement automatique des lots suivants)' : 'DÉSACTIVÉ 🟠'}\nFichiers détectés : ${(data.files_detected || []).join(', ')}`
        }]);
        if (!reuseActiveTab) {
          const logicAiUrl = getTargetAiUrl(newProjectLogicAi);
          window.open(logicAiUrl, '_blank');
        }
      } else {
        alert('Erreur Hermes : ' + (data.error || 'Inconnue'));
      }
    }).catch(err => {
      alert(`Erreur de connexion au Moteur Local : ${err.message}`);
    });
  };

  const handleFileUpload = async (files: FileList | File[] | File) => {
    let fileArray = Array.isArray(files) ? files : (files instanceof FileList ? Array.from(files) : [files]);
    let originalZipFile: File | null = null; // On garde le ZIP original pour le mode Multi-Batch

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
          originalZipFile = zf; // Sauvegarder le ZIP original
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

    // Notification de dépôt de fichiers
    const targetProj = activeProject || newProjectName || "Projet_Stitch";
    const uploadedNames = fileArray.map(f => f.name).join(', ');
    console.log(`[TROMBONE] Fichiers déposés pour ${targetProj}: ${uploadedNames}`);

    // KIROV5 MULTI-BATCH: Si plus de 3 fichiers HTML (ZIP ou Dossier complet)
    const totalHtmlFiles = htmlFiles.length; // htmlFiles contains all HTML files (already extracted or dropped)
    if (totalHtmlFiles > 3) {
      const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
      const genId = originalZipFile
        ? "Projet_ZIP_" + originalZipFile.name.replace(/[^a-zA-Z0-9]/g, '_').replace('.zip', '') + '_' + Date.now().toString().slice(-4)
        : "Projet_BATCH_" + Date.now().toString().slice(-4);
      const designProjectId = activeProject || genId;
      if (!activeProject) setActiveProject(designProjectId);

      setMessages(prev => [...prev, {
        id: Date.now().toString() + "_batch",
        role: "assistant",
        content: `🤖 KIROV5 MULTI-BATCH DÉTECTÉ !

Hermes a détecté ${totalHtmlFiles} pages HTML dans votre ZIP.\nDécoupage automatique en lots de 3 fichiers en cours...\nDémarrage de l'automatisation séquentielle via DeepSeek !`,
        widget: "phases"
      }]);
      setActivePhase(1);

      // Créer le ZIP dynamique ou lire l'existant
      let zipBase64 = "";
      if (originalZipFile) {
        zipBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(originalZipFile!);
        });
      } else {
        // Zippage dynamique des fichiers déposés (pour multi-batch sans ZIP)
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
        const zip = new JSZip();
        for (const f of fileArray) {
          zip.file(f.name, f);
        }
        zipBase64 = await zip.generateAsync({ type: "base64" });
      }

      fetch("http://localhost:5005/api/bridge/trombone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip_base64: zipBase64,
          zip_mode: true,
          target_ai: logicAi,
          target_project: designProjectId,
          user_prompt: newProjectName.trim() ? `${newProjectName} - ${newProjectDesc}` : `Application multi-pages issue de ${originalZipFile.name}`
        })
      }).then(async res => {
        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + "_hermes",
            role: "assistant",
            content: `✅ ${data.message}\n\n📡 Lot 1/${data.total_batches} transmis à DeepSeek. Les lots suivants s'enchaîneront automatiquement !\nFichiers détectés : ${(data.files_detected || []).join(', ')}`
          }]);
          // Ouvrir l'IA cible pour que l'extension capte le premier prompt
          window.open(getTargetAiUrl(logicAi), '_blank');
        } else {
          alert('Erreur Hermes : ' + (data.error || 'Inconnue'));
        }
      }).catch(err => {
        alert(`Erreur de connexion au Moteur Local : ${err.message}`);
      });

      return; // Stopper le flux classique
    }

    // Si là y a des fichiers HTML classiques (<= 3), comportement normal
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

  const handleStartFullPipeline = async (filesToUse: { path: string, content: string }[] = tromboneFiles) => {
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
6. Le fichier \`src/design.css\` (OBLIGATOIRE ET STRICTEMENT NOMMÉ AINSI) contenant TOUTES les variables CSS du projet (\`:root\`). Les composants DOIVENT se servir de ces variables. INTERDICTION de coder des couleurs hex/rgb en dur dans les classes Tailwind ou les styles inlines (ex: utilise \`bg-[var(--primary)]\`). Importe ce fichier dans \`main.tsx\` ou \`App.tsx\`.
          
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
        const logicAiUrl = getTargetAiUrl(logicAi);
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

  // --- WIDGET COMPONENTS ---

  // --- HELPERS IDE ---
  const renderFsTree = (node: any, level = 0) => {
    if (!node) return null;
    if (node.type === 'directory') {
      return (
        <div key={node.path} className="flex flex-col">
          <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer text-gray-300 text-sm" style={{ paddingLeft: `${level * 12 + 8}px` }}>
            <span className="text-orange-400">📁</span>
            <span className="design-explorateur-texte design-explorateur-dossier truncate font-bold">{node.name}</span>
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
            <span className="design-explorateur-texte design-explorateur-fichier truncate">{node.name}</span>
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

  const handleIDEAction = async (action: string, errorDetails?: string) => {
    if (!activeProject) {
      alert("⚠️ Veuillez sélectionner un projet actif dans l'explorateur.");
      return;
    }
    const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";

    let prompt = "";
    if (action === "suture") {
      prompt = `🩺 SUTURE CHIRURGICALE — CORRECTION D'ERREUR DÉTECTÉE\n\n` +
        `Projet Actif : [${activeProject}]\n` +
        (errorDetails ? `🚨 DÉTAILS DE L'ERREUR RENCONTRÉE :\n\`\`\`\n${errorDetails}\n\`\`\`\n\n` : `Mission : Corriger les erreurs de build, les routes React et le typage TypeScript.\n\n`);
    } else if (action === "refactor") {
      prompt = `🔄 REFACTORING — Refactorise le code du projet [${activeProject}] pour une qualité industrielle.\n\n`;
    } else if (action === "improve") {
      prompt = `✨ AMÉLIORATION — Ajoute des animations et améliorations UI pour le projet [${activeProject}].\n\n`;
    }

    if (activeFile && fileContent) {
      prompt += `--- Fichier Actif en Édition : ${activeFile} ---\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
    }

    if (tromboneFiles.length > 0) {
      prompt += "--- Fichiers de contexte du Trombone ---\n\n";
      tromboneFiles.forEach(f => {
        prompt += `--- ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\`\n\n`;
      });
    }

    prompt += `\nRÈGLE ABSOLUE POUR LA RÉPONSE (KIROV5) :\n` +
      `Tu dois UNIQUEMENT répondre avec un objet JSON valide contenant les fichiers corrigés. Exemple:\n` +
      `\`\`\`json\n{\n  "files": [\n    { "path": "${activeFile || 'src/App.tsx'}", "content": "..." }\n  ]\n}\n\`\`\``;

    // 1. Notification visuelle dans le chat
    setMessages(prev => [...prev, {
      id: Date.now().toString() + "_action",
      role: "assistant",
      content: `🩺 Suture & Correction déclenchée pour "${activeProject}". Transmission de l'erreur à ${logicAi.toUpperCase()} en cours...`
    }]);

    // 2. Envoi direct au Bridge local pour que l'extension le capte immédiatement
    try {
      await fetch("http://localhost:5005/bridge/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_ai: logicAi,
          prompt,
          auto_submit: true,
          project_id: activeProject,
          phase_num: action
        })
      });

      // Si c'est une Suture, tenter également le moteur d'Auto-Réparation v5 en arrière-plan
      if (action === "suture") {
        fetch(`http://localhost:5005/api/mobile/v5/projects/${activeProject}/repair/auto`, {
          method: "POST"
        }).catch(() => { });
      }

      // CORRECTION TIMING : Ouvrir l'IA cible dans un onglet dédié RÉUTILISÉ
      // On réutilise la fenêtre "kirov5_ai" pour éviter d'ouvrir un nouvel onglet à chaque fois
      // Le prompt est déjà en queue, l'extension le captera automatiquement lors du prochain poll (2.5s)
      const aiWindow = window.open(getTargetAiUrl(logicAi), 'kirov5_ai_target');
      if (!aiWindow) {
        // Si le popup est bloqué, afficher un message clair
        setMessages(prev => [...prev, {
          id: Date.now().toString() + "_popup_blocked",
          role: "assistant",
          content: `⚠️ Popup bloqué par le navigateur !\n\nL'onglet ${logicAi.toUpperCase()} n'a pas pu s'ouvrir.\n\n**Solution** : Autorisez les popups pour ce site ou ouvrez manuellement : ${getTargetAiUrl(logicAi)}\n\nLe prompt est en queue (90s) — dès que l'onglet ${logicAi.toUpperCase()} sera ouvert avec l'extension active, il sera injecté automatiquement.`
        }]);
      }
    } catch (err: any) {
      console.error("[IDE] Erreur Suture:", err);
      alert(`🩺 Action ${action} transmise. Assurez-vous que le Moteur Electron tourne sur port 5005.`);
    }
  };


  const WidgetNews = () => {
    if (isFetchingNews) {
      return (
        <div className="w-full p-8 flex flex-col items-center justify-center gap-4 animate-fadeIn">
          <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
          <div className="text-cyan font-bold animate-pulse text-sm">Interrogation de l'API DeepSeek en cours...</div>
        </div>
      );
    }

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
            <span className="text-xs text-cyan font-mono font-bold tracking-widest">GÉNÉRÉ PAR DEEPSEEK API</span>
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

    if (!liveNewsData || liveNewsData.length === 0) {
      return null;
    }

    return <Carousel items={liveNewsData.map(n => (
      <div key={n.id} className="design-carte-carrousel relative rounded-2xl p-5 border border-white/10 backdrop-blur-md flex flex-col hover:border-cyan/50 transition-colors shadow-lg" style={{ background: isClient ? getCachedGradient('news-' + n.id, 0.7) : 'rgba(0,0,0,0.7)' }}>
        <span className="self-start px-2 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-md mb-3 pr-4">{n.tag}</span>
        <h3 className="design-carte-titre text-lg font-bold text-white mb-2 leading-tight mt-1">{n.title}</h3>
        <p className="design-carte-desc text-gray-400 text-sm flex-1">{n.desc}</p>
        <button
          onClick={() => setSelectedArticle(n)}
          className="absolute top-4 right-4 text-cyan text-xs font-bold hover:underline cursor-pointer px-3 py-1.5 bg-cyan/10 hover:bg-cyan/20 rounded-xl border border-cyan/30 transition-all flex items-center gap-1"
        >
          Lire l&apos;article <span className="text-[10px]">↗</span>
        </button>
      </div>
    ))} />
  };

  const WidgetYouTube = () => {
    const videos = [
      { title: "Créer une IA Souveraine", channel: "Tiger Channel", views: "1.2k" },
      { title: "React Tailwind Masterclass", channel: "UI Design", views: "5.4k" },
      { title: "Android Bridge Capacitor", channel: "Mobile Dev", views: "800" },
    ];
    return <Carousel items={videos.map((v, i) => (
      <div key={i} className="design-carte-carrousel rounded-2xl overflow-hidden border border-red-500/30 hover:border-red-500 transition-colors shadow-lg flex flex-col" style={{ background: isClient ? getCachedGradient('yt-' + i, 0.6) : 'rgba(0,0,0,0.6)' }}>
        <div className="flex-1 bg-gray-800 relative flex items-center justify-center min-h-[50%]">
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
    ))} />
  };

  // --- RENDERING PRINCIPAL ---

  const WidgetPhases = () => {
    const allPhases = [
      "Setup", "Index", "React", "CSS", "Utils", "Vite",
      "Tests", "Package", "Vérif", "Bridge", "Build"
    ];

    return (
      <div className="mt-2">
        <Carousel items={allPhases.map((p, idx) => {
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
              className={`design-carte-carrousel rounded-2xl p-4 border flex flex-col justify-between transition-all duration-500 ${cardBg}`}
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
        })} />
      </div>
    );
  };

  const currentThemeBg = activeTheme !== "random"
    ? (savedThemes.find(t => t.name === activeTheme)?.colors["bg-app"] || "radial-gradient(ellipse at 50% 20%, #1e1b4b 0%, #090a0f 70%, #000000 100%)")
    : undefined;

  return (
    <div
      className="design-app-root flex-1 w-full h-full flex flex-col overflow-hidden relative transition-all duration-700"
      style={{ background: currentThemeBg }}
    >
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



      {/* Top Status Bar (Centered) */}
      {!isIdeFullscreen && (
        <div className="w-full flex justify-center items-center pt-2 z-20 relative pointer-events-none">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar text-[10px] font-bold bg-[#05080c]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1.5 shrink-0 bg-green-900/40 px-2.5 py-1 rounded-full border border-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
              <span className="text-green-400">Online</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-orange-900/40 px-2.5 py-1 rounded-full border border-orange-500/30">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-bounce"></span>
              <span className="text-orange-400">Ext: Tiger</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-purple-900/40 px-2.5 py-1 rounded-full border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
              <span className="text-purple-400">LLM: DeepSeek</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-cyan/10 px-2.5 py-1 rounded-full border border-cyan/20">
              <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_#08b3c9] animate-pulse"></span>
              <span className="text-cyan">Electron</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-gray-500/10 px-2.5 py-1 rounded-full border border-gray-500/20 opacity-60">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              <span className="text-gray-400">Mobile (Capacitor)</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {!isIdeFullscreen && (
        <header className="design-header backdrop-blur-md z-10 flex justify-between items-center shadow-lg -mt-2">
          <div className="flex items-center gap-3">
            <div className="design-logo flex items-center justify-center">
              <span>🐯</span>
            </div>
            <div>
              <h1 className="design-titre whitespace-nowrap">v0.reponse : OS Souverain v0.1.0 - idecode-2026</h1>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 w-full">

        {/* === NOUVEAU : ZONE IDE INTEGREE === */}
        {activeProject && (
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full animate-fadeIn">

            {/* 1. Left Action Bar */}
            <div className="design-ide-toolbar w-full h-16 lg:w-16 lg:h-full bg-black/80 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-row lg:flex-col items-center justify-around lg:justify-start lg:py-4 px-2 lg:px-0 gap-2 lg:gap-6 z-20 shadow-xl overflow-x-auto lg:overflow-x-visible">
              <button title="Fermer le projet" onClick={() => { setActiveProject(null); setActiveFile(null); }} className="design-ide-btn-action w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all mb-4">
                ✕
              </button>

              <button title="Suture (Correction Bug)" onClick={() => handleIDEAction("suture")} className="design-ide-btn-action w-10 h-10 rounded-xl bg-white/5 hover:bg-cyan/20 text-xl border border-white/10 hover:border-cyan flex items-center justify-center transition-all group relative">
                🩺
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-cyan pointer-events-none transition-opacity">Auto-Suture</span>
              </button>

              <button title="Refactoring" onClick={() => handleIDEAction("refactor")} className="design-ide-btn-action w-10 h-10 rounded-xl bg-white/5 hover:bg-purple-500/20 text-xl border border-white/10 hover:border-purple-500 flex items-center justify-center transition-all group relative">
                🔄
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-purple-400 pointer-events-none transition-opacity">Refactoring</span>
              </button>

              <button title="Amélioration" onClick={() => handleIDEAction("improve")} className="design-ide-btn-action w-10 h-10 rounded-xl bg-white/5 hover:bg-yellow-500/20 text-xl border border-white/10 hover:border-yellow-500 flex items-center justify-center transition-all group relative">
                ✨
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-yellow-400 pointer-events-none transition-opacity">Amélioration</span>
              </button>

              <button
                title="Corriger Arborescence (Fix Extensions)"
                onClick={() => {
                  if (!activeProject) return;
                  fetch("http://localhost:5005/api/fix-extensions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project_id: activeProject })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) alert(data.message);
                    else alert("Erreur: " + data.error);
                  })
                  .catch(e => alert("Erreur réseau: " + e.message));
                }}
                className="design-ide-btn-action w-10 h-10 rounded-xl bg-white/5 hover:bg-orange-500/20 text-xl border border-white/10 hover:border-orange-500 flex items-center justify-center transition-all group relative"
              >
                🛠️
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-orange-400 pointer-events-none transition-opacity font-bold">
                  Fix Arborescence (.txt ➡️ .tsx)
                </span>
              </button>

              <button
                title="Générateur PRD V0-Guest"
                onClick={() => {
                  setActiveProject("v0-guest");
                  setPreviewUrl("http://localhost:3007");
                  fetch("http://localhost:5005/api/bridge/launch-project", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project_id: "v0-guest" })
                  }).catch(e => console.error("Erreur lancement v0-guest:", e));
                }}
                className="design-ide-btn-action w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 text-cyan hover:from-cyan hover:to-purple-500 hover:text-black text-xl border border-cyan/40 flex items-center justify-center transition-all group relative shadow-[0_0_12px_rgba(0,240,255,0.3)]"
              >
                🎁
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-cyan font-bold pointer-events-none transition-opacity">
                  V0-Guest PRD Generator
                </span>
              </button>

              <button
                title="Design v0 (Studio Visuel & Preview Split)"
                onClick={() => {
                  const nextState = !isDesignMode;
                  setIsDesignMode(nextState);
                  if (nextState && !previewUrl) {
                    const isNextJs = fsTree && JSON.stringify(fsTree).includes("next.config");
                    setPreviewUrl(isNextJs ? "http://localhost:3000" : "http://localhost:5173");
                  }
                }}
                className={`design-ide-btn-action w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative border ${isDesignMode ? 'bg-pink-500 text-white border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-white/5 hover:bg-pink-500/20 text-pink-500 border-white/10 hover:border-pink-500'}`}
              >
                🎨
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-pink-500 pointer-events-none transition-opacity font-bold">
                  Design v0 (Split View)
                </span>
              </button>

              <div className="flex-1"></div>

              <button
                title={isIdeFullscreen ? "Réduire (Afficher le Chat)" : "Pleine Page (Masquer le Chat)"}
                onClick={() => setIsIdeFullscreen(!isIdeFullscreen)}
                className={`design-ide-btn-action w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative border ${isIdeFullscreen ? 'bg-cyan text-black border-cyan' : 'bg-white/5 hover:bg-cyan/20 text-cyan border-white/10 hover:border-cyan'}`}
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
                className="design-ide-btn-action w-10 h-10 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white text-xl border border-green-500/30 hover:border-green-500 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] group relative"
              >
                🚀
                <span className="absolute left-14 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap text-green-400 pointer-events-none transition-opacity font-bold">Lancer Preview</span>
              </button>
            </div>

            {/* 2. Explorateur de fichiers */}
            <div className="design-explorateur w-64 bg-[#0a0a0a]/95 border-r border-white/10 overflow-y-auto flex flex-col hide-scrollbar z-20 shadow-2xl">
              <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></span>
                    Projet Actif
                  </span>
                  <button
                    onClick={() => {
                      fetch("http://localhost:5005/api/projects")
                        .then(r => r.json())
                        .then(d => { if (d.success && d.projects) setRealProjects(d.projects.map((p: string) => ({ name: p, desc: "Projet local", bg: "" }))); })
                        .catch(() => { });
                    }}
                    className="text-xs text-gray-400 hover:text-cyan p-1 transition-colors"
                    title="Actualiser la liste des projets"
                  >
                    🔄
                  </button>
                </div>

                {/* SÉLECTEUR DE PROJETS INTERACTIF */}
                <select
                  value={activeProject || ""}
                  onFocus={() => {
                    fetch("http://localhost:5005/api/projects")
                      .then(r => r.json())
                      .then(d => { if (d.success && d.projects) setRealProjects(d.projects.map((p: string) => ({ name: p, desc: "Projet local", bg: "" }))); })
                      .catch(() => { });
                  }}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) {
                      setActiveProject(selected);
                      setActiveFile(null);
                      setFileContent("");
                      fetch("http://localhost:5005/api/bridge/launch-project", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ project_id: selected })
                      }).catch(err => console.error("Erreur de lancement :", err));
                    }
                  }}
                  className="w-full bg-[#161616] text-cyan font-bold text-xs border border-cyan/40 rounded-xl px-2.5 py-2 outline-none focus:border-cyan focus:ring-1 focus:ring-cyan shadow-[0_0_10px_rgba(8,179,201,0.2)] cursor-pointer truncate"
                >
                  <option value="" disabled className="bg-black text-gray-400">-- Choisir un projet --</option>
                  {realProjects.length > 0 ? (
                    realProjects.map((p) => (
                      <option key={p.name} value={p.name} className="bg-black text-white font-medium py-1">
                        📁 {p.name}
                      </option>
                    ))
                  ) : (
                    <option value={activeProject || "Projet_blog_8831"} className="bg-black text-white py-1">
                      📁 {activeProject || "Projet_blog_8831"}
                    </option>
                  )}
                </select>
              </div>
              <div className="py-2">
                {fsTree ? renderFsTree(fsTree) : <div className="text-gray-500 text-xs px-4 py-2 animate-pulse">Scan du projet...</div>}
              </div>
            </div>

            {/* 3. Editeur Monaco et Preview Split */}
            <div className="design-editeur flex-1 flex flex-col bg-[#1e1e1e] z-20 shadow-2xl relative">
              <div className="design-editeur-onglet h-12 bg-[#252526] border-b border-black flex justify-between items-center px-4">
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

              <div className="flex-1 relative flex overflow-hidden">
                {isDesignMode ? (
                  /* --- MODE DESIGN V0 : SPLIT VIEW 2 PANNEAUX (GAUCHE: RETOUCHE, DROITE: PREVIEW 5173/5174) --- */
                  <div className="flex-1 flex w-full h-full bg-[#0a0a0a] overflow-hidden">
                    {/* PANNEAU GAUCHE (50%): INTERFACE DE RETOUCHE DESIGN */}
                    <div className="w-1/2 h-full border-r border-white/10 flex flex-col bg-[#141414]">
                      {/* HEADER DU PANNEAU DESIGN */}
                      <div className="h-12 px-4 bg-black/90 border-b border-white/10 flex justify-between items-center shrink-0 z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎨</span>
                          <div>
                            <h2 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan tracking-widest uppercase">
                              STUDIO DESIGN INTELLIGENT
                            </h2>
                            <p className="text-[10px] text-gray-400 truncate max-w-[180px]">
                              Projet : <span className="text-cyan font-bold">{activeProject || 'Projet Actif'}</span>
                            </p>
                          </div>
                        </div>

                        {/* TOGGLE STUDIO/EXPRESS & BOUTONS FERMER */}
                        <div className="flex items-center gap-2">


                          {/* BOUTON 1: FERMER ET REVENIR À L'EXPLORATEUR / CODE */}
                          <button
                            onClick={() => setIsDesignMode(false)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-all shadow"
                            title="Revenir à l'explorateur de fichiers & à l'éditeur de code"
                          >
                            📁 Fermer (Code)
                          </button>

                          {/* BOUTON 2: FERMER ET REVENIR DIRECTEMENT À LA PAGE D'ACCUEIL */}
                          <button
                            onClick={() => {
                              setIsDesignMode(false);
                              setActiveProject(null);
                              setIsIdeFullscreen(false);
                            }}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg border border-red-500/30 text-[11px] font-bold flex items-center gap-1 transition-all shadow"
                            title="Quitter le projet et revenir à la page d'accueil"
                          >
                            🏠 Fermer (Accueil)
                          </button>
                        </div>
                      </div>

                      {/* CONTENU DU STUDIO DESIGN */}
                      <div className="flex-1 overflow-hidden relative">
                        <iframe
                          src={`/admin-design.html?project=${activeProject}`}
                          className="w-full h-full border-0 bg-black"
                          title="Studio Admin Design"
                        />
                      </div>
                    </div>

                    {/* PANNEAU DROITE (50%): APPLICATION ACTIVE SUR LOCALHOST 5173 / 5174 */}
                    <div className="design-preview w-1/2 h-full flex flex-col">
                      {/* HEADER PREVIEW */}
                      <div className="h-12 px-4 bg-black/90 border-b border-white/10 flex justify-between items-center shrink-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                          <span className="text-xs font-mono font-bold text-green-400">
                            LIVE PREVIEW ({fsTree && JSON.stringify(fsTree).includes("next.config") ? "LOCALHOST:3000" : "LOCALHOST:5173-5174"})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : "http://localhost:5173")}
                            onChange={(e) => setPreviewInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setPreviewUrl(previewInput);
                            }}
                            className="bg-black/80 border border-green-500/30 text-green-400 text-[11px] px-2.5 py-1 rounded outline-none focus:border-green-400 w-48 font-mono"
                          />
                          <button
                            onClick={() => {
                              if (!activeProject) return;
                              fetch("http://localhost:5005/api/bridge/launch-project", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ project_id: activeProject })
                              }).catch(e => console.error("Erreur lancement preview:", e));
                            }}
                            className="px-2.5 py-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white text-[11px] rounded font-bold border border-green-500/30 transition-all flex items-center gap-1"
                            title="Relancer / Démarrer le serveur Preview"
                          >
                            🚀 Relancer
                          </button>
                        </div>
                      </div>

                      {/* IFRAME APPLICATION ACTIVE */}
                      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--preview-bg)' }}>
                        <iframe
                          src={previewUrl || (fsTree && JSON.stringify(fsTree).includes("next.config") ? "http://localhost:3000" : "http://localhost:5173")}
                          className="w-full h-full border-none"
                          title="Application Preview Live"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- MODE ÉDITEUR STANDARD (CODE & PREVIEW OPTIONNEL) --- */
                  <>
                    <div className={`relative flex flex-col ${previewUrl ? 'w-1/2 border-r border-black' : 'w-full'}`}>
                      {activeFile ? (
                        <Editor
                          height="100%"
                          theme="vs-dark"
                          path={activeFile}
                          language={activeFile.endsWith('.tsx') || activeFile.endsWith('.ts') ? 'typescript' : activeFile.endsWith('.css') ? 'css' : activeFile.endsWith('.html') ? 'html' : activeFile.endsWith('.json') ? 'json' : 'javascript'}
                          value={fileContent}
                          onChange={(val) => {
                            const newContent = val || "";
                            setFileContent(newContent);
                            if ((window as any).saveTimer) clearTimeout((window as any).saveTimer);
                            (window as any).saveTimer = setTimeout(() => {
                              handleSaveFile(newContent);
                            }, 500);
                          }}
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
                          <span className="font-medium tracking-wide text-sm">Sélectionnez un fichier dans l'explorateur ou activez Design v0</span>
                        </div>
                      )}
                    </div>

                    {/* Section Preview Iframe Standard */}
                    {previewUrl && (
                      <div className="design-preview w-1/2 relative" style={{ background: 'var(--preview-bg)' }}>
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
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Chat Area (Responsive) */}
        <main
          className={`design-chat-main ${activeProject ? (isIdeFullscreen ? 'hidden w-0' : 'w-full h-[50vh] lg:h-full lg:w-96 lg:min-w-[24rem]') : 'flex-1'} border-t lg:border-t-0 lg:border-l border-white/20 bg-black/60 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] overflow-y-auto p-4 md:p-8 z-10 hide-scrollbar flex flex-col transition-all duration-500 ease-in-out`}
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
              <h2 className="text-3xl font-black text-cyan drop-shadow-lg text-center px-4">Glissez votre projet Stitch (.zip, .html, .md, .png)<br />pour préparer le câblage !</h2>
            </div>
          )}

          <div className="design-chat-layout mx-auto w-full flex flex-col pb-[140px]">

            {/* CARROUSEL DES PACKS PRD SUR CLIC DE L'ICONE */}
            {showPacksCarousel && !activeProject && (
              <WidgetPrdPacks
                selectedPacks={selectedPacks}
                togglePack={togglePack}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                setActiveProject={setActiveProject}
                handleSend={handleSend}
                isClient={isClient}
                getCachedGradient={getCachedGradient}
                onDetailStateChange={setIsPrdDetailOpen}
              />
            )}

            {!isPrdDetailOpen && (
              <div className="design-chat-bulles w-full flex flex-col">
                {messages.map((msg, index) => {
                  const lastWidgetIndex = messages.map(m => !!m.widget).lastIndexOf(true);
                  const isLastWidgetOverall = index === lastWidgetIndex;
                  const isAccueilMsg = index === 0;

                  return (
                    <div key={msg.id} className={`w-full max-w-full flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      {/* Message Bubble */}
                      <div
                        className={`${isAccueilMsg ? 'design-msg-accueil' : 'design-chat-bulle'} p-5 rounded-3xl backdrop-blur-md border border-white/20 text-gray-100 shadow-xl ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                        style={{ background: isClient ? getCachedGradient('msg-' + msg.id, msg.role === "user" ? 0.8 : 0.6) : 'rgba(0,0,0,0.6)' }}
                      >
                        {msg.content}
                      </div>

                      {/* Dynamic Widgets Injected into Chat (ONLY LAST ONE OVERALL) */}
                      {isLastWidgetOverall && msg.widget === "projects" && <WidgetProjects isClient={isClient} getCachedGradient={getCachedGradient} setActiveProject={setActiveProject} />}
                      {isLastWidgetOverall && msg.widget === "news" && WidgetNews()}
                      {isLastWidgetOverall && msg.widget === "youtube" && WidgetYouTube()}
                      {isLastWidgetOverall && msg.widget === "settings" && WidgetSettings({ isClient, getCachedGradient, mouchardLogs, activePhase, availableProjects, setAvailableProjects, selectedLaunchProject, setSelectedLaunchProject, isMobileNative })}
                      {isLastWidgetOverall && msg.widget === "phases" && WidgetPhases()}
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Right Sidebar (Mouchard d'Installation) */}
        {isRightSidebarOpen && (() => {
          // --- ANALYSE DYNAMIQUE DU STATUT DU TERMINAL ---
          const recentLogsStr = mouchardLogs.slice(-10).join(" ").toLowerCase();
          const firstLogsStr = mouchardLogs.slice(0, 10).join(" ").toLowerCase();
          const allRecentStr = recentLogsStr + " " + firstLogsStr;

          let tColor = "text-green-400";
          let tDot = "bg-green-400 shadow-[0_0_8px_#4ade80]";
          let tBorder = "border-green-500/30 shadow-[-10px_0_30px_rgba(34,197,94,0.1)]";
          let tBg = "bg-green-950/20";
          let tTitle = "Terminal (Prêt)";

          if (allRecentStr.includes("erreur") || allRecentStr.includes("failed") || allRecentStr.includes("⚠️") || allRecentStr.includes("exception") || allRecentStr.includes("impossible") || allRecentStr.includes("[err")) {
            tColor = "text-red-500";
            tDot = "bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]";
            tBorder = "border-red-500/50 shadow-[-10px_0_30px_rgba(239,68,68,0.2)]";
            tBg = "bg-red-950/30";
            tTitle = "Terminal (Erreur)";
          } else if (
            allRecentStr.includes("en cours") || 
            allRecentStr.includes("execution") || 
            allRecentStr.includes("install") || 
            allRecentStr.includes("lancement") || 
            allRecentStr.includes("analyse") || 
            allRecentStr.includes("suture") ||
            allRecentStr.includes("patch")
          ) {
            if (!allRecentStr.includes("terminé") && !allRecentStr.includes("détecté") && !allRecentStr.includes("nettoyée") && !allRecentStr.includes("✅")) {
              tColor = "text-purple-400";
              tDot = "bg-purple-400 animate-ping shadow-[0_0_12px_#c084fc]";
              tBorder = "border-purple-500/50 shadow-[-10px_0_30px_rgba(168,85,247,0.2)]";
              tBg = "bg-purple-950/30";
              tTitle = "Terminal (Travail...)";
            }
          }

          return (
          <aside className={`w-80 border-l flex flex-col z-50 fixed right-0 top-0 h-screen bg-black transition-all duration-500 shadow-2xl ${tBorder}`}>
            <div className={`p-4 border-b border-white/10 flex justify-between items-center transition-colors duration-500 ${tBg}`}>
              <h3 className={`${tColor} font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors`}>
                <span className={`w-2 h-2 rounded-full ${tDot}`}></span>
                {tTitle}
              </h3>
              <div className="flex gap-2 items-center">
                <button
                  onClick={async () => {
                    // Nettoyage immédiat du frontend
                    setMouchardLogs(["> Console nettoyée... Arrêt des processus en cours..."]);
                    try {
                      const res = await fetch("http://localhost:5005/api/bridge/stop-launch", { method: "POST" });
                      if (!res.ok) {
                        setMouchardLogs([
                          "> ⚠️ ERREUR : La commande n'existe pas !",
                          "> ⚠️ VOUS DEVEZ REDÉMARRER LA CONSOLE NOIRE !",
                          "> Fermez la fenêtre COMMAND_MENU_TIGER.bat et relancez-la."
                        ]);
                        return;
                      }
                      const data = await res.json();
                      setMouchardLogs(["> ✅ " + (data.message || "Console nettoyée et processus arrêtés.")]);
                    } catch (e: any) {
                      setMouchardLogs([
                        "> ⚠️ ERREUR DE CONNEXION AU MOTEUR !",
                        "> Le moteur est peut-être éteint ou nécessite un redémarrage.",
                        "> Détail: " + e.message
                      ]);
                    }
                  }}
                  className="py-1 px-2 rounded text-white font-bold text-[10px] bg-red-500/20 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors shadow-md"
                  title="Arrêter l'installation ou le serveur et nettoyer la console"
                >
                  ⏹️ Stop/Clear
                </button>
                <button onClick={() => setIsRightSidebarOpen(false)} className="text-gray-500 hover:text-white transition-colors ml-2 font-bold text-lg">✕</button>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto flex flex-col-reverse hide-scrollbar bg-black">
              <div id="mouchard-terminal-logs">
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
          );
        })()}

      </div> {/* Fermeture div flex-1 principal pour que le footer passe en bas */}

      {/* Input Area + Integrated Status & Actions Toolbar Footer */}
      <footer className="design-footer absolute bottom-0 left-0 w-full backdrop-blur-2xl z-50 flex flex-col p-2 md:p-3 bg-black/80 border-t border-white/15 gap-2">
        {/* Integrated Top Strip: Action Icons Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md">
          {/* Action Icons Toolbar (Moved to the Right of Chat Bar) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 px-1">
            
            {/* ⚙️ Réglages */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="design-app-icone design-icone-reglages flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              title="Réglages"
            >
              <span className="z-10 drop-shadow-md group-hover:rotate-45 transition-transform">⚙️</span>
              <span className="design-app-texte z-10 drop-shadow-md">Réglages</span>
            </button>

            {/* 🧠 Assistant IA */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const logicAi = localStorage.getItem("tiger_targetAi") || "deepseek";
                  const aiUrl = getTargetAiUrl(logicAi);
                  const bridge = (window as any).AndroidBridge;
                  if (bridge && bridge.openAIWithPrompt) {
                    bridge.openAIWithPrompt(aiUrl, "Bonjour ! Je viens d'ouvrir l'Assistant IA.");
                  } else {
                    window.open(aiUrl, "_blank");
                  }
                }
              }}
              className="design-app-icone design-icone-assistant flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              title="Assistant IA"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🧠</span>
              <span className="design-app-texte z-10 drop-shadow-md">Assistant IA</span>
            </button>

            {/* 📁 Projets */}
            <button
              onClick={() => {
                handleSend("Mes projets");
                setInput("");
              }}
              className="design-app-icone design-icone-projets flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              title="Projets"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">📁</span>
              <span className="design-app-texte z-10 drop-shadow-md">Projets</span>
            </button>

            {/* 💎 Packs PRD */}
            <button
              onClick={() => {
                setShowPacksCarousel(prev => !prev);
                setTimeout(() => {
                  const el = document.getElementById("prd-packs-carousel-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              className="design-app-icone design-icone-packs flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              title="Packs PRD"
            >
              {selectedPacks.length > 0 && (
                <span className="absolute -top-0 -right-0 bg-indigo-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white/20 shadow-md z-20">
                  {selectedPacks.length}
                </span>
              )}
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">💎</span>
              <span className="design-app-texte z-10 drop-shadow-md">Packs PRD</span>
            </button>

            {/* 🎁 V0-Guest */}
            <button
              onClick={() => {
                setActiveProject("v0-guest");
                setPreviewUrl("http://localhost:3007");
                fetch("http://localhost:5005/api/bridge/launch-project", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ project_id: "v0-guest" })
                }).catch(e => console.error("Erreur lancement v0-guest:", e));
              }}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #00c6ff, #0072ff)' }}
              title="Générateur PRD Hermes (V0-Guest)"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🎁</span>
              <span className="design-app-texte z-10 drop-shadow-md">V0-Guest</span>
            </button>
            <button
              onClick={() => {
                handleSend("Actualités IA");
                setInput("");
              }}
              className="design-app-icone design-icone-actualites flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              title="Actualités"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">📰</span>
              <span className="design-app-texte z-10 drop-shadow-md">Actualités</span>
            </button>

            {/* 🖥️ Console-V0 */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setMouchardLogs(prev => ["> Console-V0 ouverte. Prêt pour l'Introspection AST.", ...prev]);
                setIsRightSidebarOpen(true);
              }}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #475163, #1f2530)' }}
              title="Console-V0"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🖥️</span>
              <span className="design-app-texte z-10 drop-shadow-md">Console-V0</span>
            </button>

            {/* 🧬 Patch UI */}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  setIsRightSidebarOpen(true);
                  const targetProj = activeProject || "Projet_blog_8831";
                  const targetFileRelative = activeFile || "src/App.tsx";
                  const fullTargetFilePath = `e:\\v0reponses\\v0-moteur-electron\\v0saveprojets\\${targetProj}\\${targetFileRelative.replace(/\//g, '\\')}`;

                  setTimeout(() => {
                    const logContainer = document.getElementById('mouchard-terminal-logs');
                    if (logContainer) {
                      logContainer.innerHTML = `<div class="mb-1 opacity-90 break-words text-[#e27396]">> 🚀 Lancement du Patch UI (Suture dynamique sur ${targetProj})...</div>` + logContainer.innerHTML;
                    }
                  }, 50);

                  const res = await fetch("http://localhost:5005/api/design/intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      intent: "PATCH_UI",
                      payload: {
                        targetFile: fullTargetFilePath,
                        templateId: "stitch_mock"
                      }
                    })
                  });
                  const data = await res.json();
                  const logContainerAfter = document.getElementById('mouchard-terminal-logs');
                  if (logContainerAfter) {
                    if (data.success) {
                      logContainerAfter.innerHTML = `<div class="mb-1 opacity-90 break-words text-[#00e676]">> 🎯 Patch appliqué avec succès par le LLM !</div>` + logContainerAfter.innerHTML;
                    } else {
                      logContainerAfter.innerHTML = `<div class="mb-1 opacity-90 break-words text-red-400">> ⚠️ Erreur Patch UI AST : ${data.error || 'Basculement vers la Suture IA...'}</div>` + logContainerAfter.innerHTML;
                      handleIDEAction("suture", `Échec du patch automatique AST : ${data.error || 'Format incompatible'}`);
                    }
                  }
                } catch (err: any) {
                  const logContainer = document.getElementById('mouchard-terminal-logs');
                  if (logContainer) {
                    logContainer.innerHTML = `<div class="mb-1 opacity-90 break-words text-red-500">> ⛔ Erreur Patch UI : ${err.message}</div>` + logContainer.innerHTML;
                  }
                  handleIDEAction("suture", `Exception Patch UI: ${err.message}`);
                }
              }}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #1b6345, #08291a)' }}
              title="Patch UI"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🧬</span>
              <span className="design-app-texte z-10 drop-shadow-md">Patch UI</span>
            </button>

            {/* 🧹 Flush Queue */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("http://localhost:5005/bridge/flush", { method: "POST" });
                  const data = await res.json();
                  setMessages(prev => [...prev, {
                    id: Date.now().toString() + "_flush",
                    role: "assistant",
                    content: `🧹 File Bridge vidée ! ${data.flushed || 0} prompt(s) supprimé(s).\n\nLa queue est vide. Relancez votre Suture ou Patch.`
                  }]);
                  const logContainer = document.getElementById('mouchard-terminal-logs');
                  if (logContainer) {
                    logContainer.innerHTML = `<div class="mb-1 opacity-90 break-words text-yellow-400">> 🧹 Bridge Queue FLUSH — ${data.flushed || 0} tâche(s) nettoyée(s)</div>` + logContainer.innerHTML;
                  }
                } catch (e) {
                  alert("Moteur hors ligne : impossible de vider la queue.");
                }
              }}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #a17c23, #4f3b0c)' }}
              title="Vider la file Bridge (déblocage injection)"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🧹</span>
              <span className="design-app-texte z-10 drop-shadow-md">Flush Queue</span>
            </button>

            {/* 🎨 Thèmes */}
            <button
              onClick={() => setIsColorModalOpen(true)}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #993a61, #4d152c)' }}
              title="Thèmes & Couleurs"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform">🎨</span>
              <span className="design-app-texte z-10 drop-shadow-md">Thèmes</span>
            </button>

            {/* 📱 v0-apk */}
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="design-app-icone flex flex-col items-center justify-center shrink-0 group relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, #5b227a, #230930)' }}
              title="Compiler l'Application Mobile (.apk - Java Portable)"
            >
              <span className="z-10 drop-shadow-md group-hover:scale-110 transition-transform animate-pulse">📱</span>
              <span className="design-app-texte z-10 drop-shadow-md">v0-apk</span>
            </button>

          </div>
        </div>

        {/* Input Bar */}
        <div className="px-3 pb-1 pt-1 relative w-full flex flex-col gap-2">

          {/* INPUT FICHIER PERMANENT (Accessible depuis la Modal et le Chat) */}
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
            <div id="creation-mode-container" className="absolute bottom-full left-2 right-2 mb-3 flex flex-col gap-4 bg-[#05080c]/98 p-5 rounded-3xl border-2 border-cyan/50 shadow-[0_0_50px_rgba(8,179,201,0.5)] backdrop-blur-2xl animate-fadeIn z-[100] max-h-[82vh] overflow-y-auto custom-scrollbar text-white">
              {/* Header */}
              <div className="flex justify-between items-center mb-1 sticky top-0 bg-[#05080c]/98 z-10 py-2 border-b border-cyan/20">
                <h3 className="text-cyan font-black flex items-center gap-2 text-base md:text-lg uppercase tracking-wider">
                  <span className="animate-pulse w-2.5 h-2.5 bg-cyan rounded-full shadow-[0_0_10px_#08b3c9]"></span> ⚙️ CONFIGURATION DU PROJET
                </h3>
                <button onClick={() => setIsCreationMode(false)} className="text-gray-400 hover:text-white bg-white/10 hover:bg-red-500 rounded-full w-7 h-7 flex items-center justify-center transition-colors">✕</button>
              </div>

              {/* ZONE 1: CIBLER LE PROJET */}
              <div className="flex flex-col gap-2 bg-black/60 p-3.5 rounded-2xl border border-white/10">
                <label className="text-cyan font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                  <span>📁</span> CIBLER LE PROJET :
                </label>
                <select
                  value={activeProject || ""}
                  onChange={e => {
                    const val = e.target.value;
                    setActiveProject(val || null);
                    if (val) {
                      setNewProjectName(val.replace('Projet_', '').split('_')[0]);
                      fetch("http://localhost:5005/api/bridge/launch-project", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ project_id: val })
                      }).catch(err => console.error("Erreur de lancement :", err));
                    } else {
                      setNewProjectName("");
                    }
                  }}
                  className="w-full bg-[#11161d] text-white border border-cyan/30 rounded-xl px-3 py-2 outline-none focus:border-cyan text-xs cursor-pointer"
                >
                  <option value="">-- SÉLECTIONNER UN PROJET --</option>
                  {realProjects.map(p => <option key={p.name} value={p.name}>📁 {p.name}</option>)}
                </select>
              </div>

              {/* ZONE 2: INSTRUCTIONS SPÉCIFIQUES */}
              <div className="flex flex-col gap-2 bg-black/60 p-3.5 rounded-2xl border border-white/10">
                <label className="text-cyan font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                  <span>📝</span> INSTRUCTIONS SPÉCIFIQUES :
                </label>
                <textarea
                  value={newProjectInstructions}
                  onChange={e => setNewProjectInstructions(e.target.value)}
                  placeholder="Instructions pour le Patch ou la modification..."
                  className="w-full bg-[#11161d] text-white border border-slate-700 rounded-xl px-3.5 py-2 outline-none focus:border-cyan h-14 resize-none text-xs leading-relaxed"
                ></textarea>
              </div>

              {/* ZONE 3: PARAMÈTRES & CIBLES */}
              <div className="flex flex-col gap-3.5 bg-black/60 p-3.5 rounded-2xl border border-white/10">
                <div className="text-cyan font-bold uppercase text-xs tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                  <span>⚡</span> PARAMÈTRES & CIBLES
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 block">Nom du Projet</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        disabled={!!activeProject}
                        placeholder="Ex: MonSuperProjet"
                        className="flex-1 bg-[#11161d] text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-xs disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newProjectName.trim()) {
                            const cleanName = newProjectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                            const genId = cleanName;
                            setActiveProject(genId);
                            try {
                              const API_BASE = 'http://localhost:5005';
                              await fetch(`${API_BASE}/v1/projects/set-active`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: genId, project_id: genId })
                              }).catch(() => null);
                              await fetch(`${API_BASE}/api/fs/write`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  project: genId,
                                  file: "README.md",
                                  content: `# ${newProjectName.trim()}\n\nInitialisé par Tiger IA V0.`
                                })
                              }).catch(() => null);
                            } catch (err) {
                              console.error("Erreur lors de la création du dossier sur disque:", err);
                            }
                          }
                        }}
                        className="px-3 py-2 bg-cyan/20 hover:bg-cyan text-cyan hover:text-black font-bold text-xs rounded-xl border border-cyan/40 transition-colors whitespace-nowrap"
                      >
                        Valider
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 block">Stack Technique</label>
                    <select
                      value={newProjectStack}
                      onChange={e => setNewProjectStack(e.target.value)}
                      className="w-full bg-[#11161d] text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan text-xs cursor-pointer"
                    >
                      <option value="Vite + React + Tailwind + TS">⭐ 1er Choix (Prioritaire) : Vite + React + Tailwind + TS</option>
                      <option value="Next.js + Tailwind + App Router">Next.js + Tailwind + App Router</option>
                      <option value="HTML + CSS Vanilla + JS">HTML + CSS Vanilla + JS</option>

                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-cyan font-bold uppercase text-[10px] tracking-widest mb-1 block">Description / Vision</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    placeholder="Décrivez l'application ou copiez votre PRD..."
                    className="w-full bg-[#11161d] text-white border border-slate-700 rounded-xl px-3.5 py-2 outline-none focus:border-cyan h-16 resize-none text-xs leading-relaxed"
                  ></textarea>
                </div>

                {/* BARRE D'OPTIONS ET DE COMMANDES DE DEPART */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                  {/* INTELLIGENCE CIBLE */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-cyan uppercase tracking-wider">Intelligence Cible</span>
                    <select
                      value={newProjectLogicAi}
                      onChange={e => {
                        setNewProjectLogicAi(e.target.value);
                        localStorage.setItem("tiger_targetAi", e.target.value);
                      }}
                      className="bg-[#11161d] text-cyan font-bold text-xs border border-cyan/40 rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan cursor-pointer"
                    >
                      <option value="deepseek">🩵 DeepSeek</option>
                      <option value="stitch">🎨 Stitch (Google)</option>
                      <option value="v0">⚡ V0.dev</option>
                      <option value="chatgpt">🟢 ChatGPT</option>
                      <option value="claude">🟠 Claude</option>
                      <option value="kimi">🌙 Kimi (Moonshot)</option>
                      <option value="gemini">🔵 Gemini</option>
                      <option value="qwen">🔴 Qwen</option>
                    </select>
                  </div>

                  {/* MODE & LOT DE DÉPART */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-cyan uppercase tracking-wider">💉 Mode & Lot de Départ</span>
                    <select
                      value={selectedStartPhase}
                      onChange={e => setSelectedStartPhase(Number(e.target.value))}
                      className="bg-[#11161d] text-white font-bold text-xs border border-cyan/40 rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan cursor-pointer"
                    >
                      <option value={1}>🎨 Phase 1 : Le Frontend (Stitch/v0)</option>
                      <option value={2}>💻 Phase 2 : Le Backend (Assistant IA)</option>
                    </select>
                  </div>

                  {/* BOUTON TOGGLE AUTO-PILOT */}
                  <button
                    type="button"
                    onClick={() => setIsAutoPilotOn(!isAutoPilotOn)}
                    className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${isAutoPilotOn ? 'bg-green-600/30 text-green-300 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'}`}
                  >
                    <span>🤖</span>
                    <span>AUTO-PILOT : {isAutoPilotOn ? 'ON 🟢' : 'OFF ⚪'}</span>
                  </button>

                  {/* BOUTON TOGGLE INJECTER DANS L'ONGLET DEJA OUVERT */}
                  <button
                    type="button"
                    onClick={() => setReuseActiveTab(!reuseActiveTab)}
                    className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${reuseActiveTab ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    title="Cochez pour réutiliser l'onglet KIROV5 au lieu d'ouvrir un nouvel onglet"
                  >
                    <span>🔗</span>
                    <span>{reuseActiveTab ? '✓ Injecter dans l\'onglet déjà ouvert' : 'Ouvrir un nouvel onglet'}</span>
                  </button>

                  {/* PACKS PRD */}
                  <button
                    type="button"
                    onClick={() => setShowPacksCarousel(prev => !prev)}
                    className={`mt-4 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${selectedPacks.length > 0
                        ? 'bg-indigo-600/50 border-indigo-400 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                        : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-500/40'
                      }`}
                  >
                    <span>💎</span>
                    <span>Packs PRD ({selectedPacks.length})</span>
                    {selectedPacks.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-cyan animate-pulse absolute -top-1 -right-1 shadow-[0_0_8px_#08b3c9]"></span>
                    )}
                  </button>

                  {/* JOINDRE ZIP (STITCH) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <span>📎</span>
                    <span>Joindre ZIP (Stitch)</span>
                  </button>
                </div>
              </div>

              {/* PANNEAU CARROUSEL / GRILLE DE SELECTION DES PACKS PRD */}
              {showPacksCarousel && (
                <div className="w-full bg-[#0a0d14]/98 p-4 rounded-2xl border-2 border-indigo-500/60 shadow-[0_0_30px_rgba(99,102,241,0.4)] my-2 text-white animate-fadeIn max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-3 z-30">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-500/30 sticky top-0 bg-[#0a0d14]/98 z-10 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💎</span>
                      <div>
                        <h4 className="text-indigo-300 font-black text-xs md:text-sm uppercase tracking-wider">PACKS PRD ARCHITECTURE ({selectedPacks.length} SÉLECTIONNÉ{selectedPacks.length > 1 ? 'S' : ''})</h4>
                        <p className="text-[10px] text-slate-400">Sélectionnez les briques fonctionnelles à intégrer au Méga-Prompt.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPacks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPacks([])}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/40 px-2 py-1 rounded-lg border border-red-500/30 transition-all"
                        >
                          Tout décocher
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPacksCarousel(false)}
                        className="text-slate-400 hover:text-white bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Input de filtre rapide */}
                  <input
                    type="text"
                    placeholder="🔍 Filtrer un pack PRD (ex: auth, ecom, mobile, saas, ai, game, sqlite...)"
                    value={packSearchQuery}
                    onChange={e => setPackSearchQuery(e.target.value)}
                    className="w-full bg-[#121824] text-xs text-white border border-indigo-500/40 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 placeholder:text-slate-500"
                  />

                  {/* Grille des 63+ Packs PRD */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {AVAILABLE_PACKS.filter(p => p.name.toLowerCase().includes(packSearchQuery.toLowerCase()) || p.id.toLowerCase().includes(packSearchQuery.toLowerCase())).map(pack => {
                      const isSelected = selectedPacks.includes(pack.id);
                      const IconComp = pack.icon;
                      return (
                        <div
                          key={pack.id}
                          onClick={() => togglePack(pack.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-1.5 relative select-none ${isSelected
                              ? 'bg-indigo-900/60 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-[1.02]'
                              : 'bg-[#11161f] border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-[#171e2b]'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`p-1 rounded-lg ${pack.color}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="accent-indigo-500 w-3.5 h-3.5 rounded cursor-pointer pointer-events-none"
                            />
                          </div>
                          <div className="font-bold text-[11px] leading-tight line-clamp-1 text-white">
                            {pack.name}
                          </div>
                          <div className="text-[8px] text-slate-400 font-mono truncate">
                            #{pack.id}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-indigo-500/20 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPacksCarousel(false)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                    >
                      ✓ Valider la sélection ({selectedPacks.length})
                    </button>
                  </div>
                </div>
              )}

              {/* BOUTONS D'ACTION (VALIDER & ANNULER) */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreationMode(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={async (e) => {
                    if (!newProjectName.trim() && !activeProject) { alert("Veuillez entrer un nom de projet ou en choisir un."); return; }
                    const cleanName = newProjectName.trim() ? newProjectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : "";
                    const genId = activeProject || cleanName || ("Projet_" + Date.now().toString().slice(-4));

                    const btn = e.currentTarget;
                    btn.innerText = '⏳ Initialisation...';
                    btn.disabled = true;

                    try {
                      const API_BASE = 'http://localhost:5005';
                      const isNativeMobile = typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform();

                      if (isNativeMobile) {
                        // 📱 MODE SOUVERAIN MOBILE (Capacitor Native)
                        try {
                          const { KirovSovereignEngine } = (window as any).Capacitor.Plugins;
                          if (KirovSovereignEngine) {
                            await KirovSovereignEngine.setActiveProject({ name: genId });
                          }
                        } catch(e) { console.warn("Plugin mobile introuvable", e); }
                      } else {
                        // 💻 MODE PC (Electron/Node)
                        // 1. Définir le projet actif & créer le dossier sur le disque dur
                        await fetch(`${API_BASE}/v1/projects/set-active`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: genId })
                        }).catch(() => null);
                      }

                      if (isNativeMobile) {
                        try {
                          const { KirovSovereignEngine } = (window as any).Capacitor.Plugins;
                          if (KirovSovereignEngine) {
                            await KirovSovereignEngine.writeFile({
                              project: genId,
                              file: "README.md",
                              content: `# ${newProjectName || genId}\n\nInitialisé par Tiger IA V0.\nStack : ${newProjectStack}\nDescription : ${newProjectDesc}`
                            });
                          }
                        } catch(e) {}
                      } else {
                        // 2. Écrire le fichier README initial
                        await fetch(`${API_BASE}/api/fs/write`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            project: genId,
                            file: "README.md",
                            content: `# ${newProjectName || genId}\n\nInitialisé par Tiger IA V0.\nStack : ${newProjectStack}\nDescription : ${newProjectDesc}`
                          })
                        }).catch(() => null);
                      }

                      const packsDetailsText = (selectedPacks && selectedPacks.length > 0)
                        ? `\n\n[PACKS PRD ARCHITECTURE SELECTIONNES (${selectedPacks.length})]\n` + selectedPacks.map(id => {
                          const pk = AVAILABLE_PACKS.find(p => p.id === id);
                          return `• ${pk ? pk.name : id} (#${id})`;
                        }).join('\n')
                        : "";

                      let stackInstructions = `\n\n[STACK TECHNIQUE OBLIGATOIRE : ${newProjectStack.toUpperCase()}]\n`;
                      if (newProjectStack.includes("Vite")) {
                        stackInstructions += "⚠️ CONSTRUCTEUR : Ce projet DOIT IMPÉRATIVEMENT être généré en **React + Vite + TypeScript (TSX)**.\n• Générer : package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx.\n• Style & Thème : Définir toutes les variables CSS :root dans src/index.css ou src/design.css.\n";
                      } else if (newProjectStack.includes("Next")) {
                        stackInstructions += "⚠️ CONSTRUCTEUR : Ce projet DOIT IMPÉRATIVEMENT être généré en **Next.js (App Router)**.\n• Générer : package.json, app/layout.tsx, app/page.tsx, app/globals.css.\n";
                      } else {
                        stackInstructions += "⚠️ CONSTRUCTEUR : Ce projet DOIT IMPÉRATIVEMENT être généré en **HTML5 / CSS Vanilla / JS**.\n• Générer : index.html, design.css, app.js.\n";
                      }

                      const megaPrompt = (newProjectDesc.trim() || newProjectInstructions.trim() || `Initialisation du projet ${newProjectName || genId}`) + stackInstructions + packsDetailsText;


                      // Déterminer l'IA cible en fonction de la phase
                      let finalTargetAi = newProjectLogicAi;
                      if (selectedStartPhase === 1) {
                        finalTargetAi = targetUiAi;
                      }

                      // 3. Lancer la mission Kirov
                      if (isNativeMobile) {
                        try {
                          const { KirovSovereignEngine } = (window as any).Capacitor.Plugins;
                          if (KirovSovereignEngine) {
                            // 1. Ouvrir l'onglet IA via la WebView In-App Native
                            const aiUrl = getTargetAiUrl(finalTargetAi);
                            await KirovSovereignEngine.openAiTab({ url: aiUrl });
                            
                            // 2. Injecter le prompt après un léger délai pour que la page charge
                            setTimeout(async () => {
                              await KirovSovereignEngine.injectPrompt({ prompt: megaPrompt, target_ai: finalTargetAi });
                            }, 4500);
                          }
                        } catch (e) {
                          alert("Le moteur souverain mobile n'est pas encore implémenté ou le plugin est manquant.");
                        }
                      } else {
                        if (selectedStartPhase === 2) {
                          await fetch(`${API_BASE}/api/bridge/trombone`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              target_project: genId, 
                              user_prompt: megaPrompt, 
                              target_ai: finalTargetAi, 
                              packs: selectedPacks, 
                              zip_mode: true, 
                              start_phase: 200, 
                              force_restart: true,
                              auto_submit: isAutoPilotOn 
                            })
                          }).catch(() => null);
                          
                          if (!reuseActiveTab) {
                            await fetch(`${API_BASE}/v1/mission/start`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: genId, prompt: "OPEN_TAB_ONLY", target_ai: finalTargetAi, reuse_tab: false })
                            }).catch(() => null);
                          }
                        } else {
                          await fetch(`${API_BASE}/v1/mission/start`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: genId, prompt: megaPrompt, stack: newProjectStack, target_ai: finalTargetAi, packs: selectedPacks, phase: selectedStartPhase, reuse_tab: reuseActiveTab, auto_submit: isAutoPilotOn })
                          }).catch(() => null);
                        }
                      }

                      setPreviewUrl(null);
                      setActiveFile(null);
                      setFileContent("");
                      setIsCreationMode(false);
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "user",
                        content: `🚀 Mission "${newProjectName || genId}" initialisée pour ${newProjectLogicAi.toUpperCase()} avec ${selectedPacks.length} pack(s) PRD. Injection du Méga-Prompt en cours...`
                      }]);
                    } catch (err: any) {
                      alert("Erreur lors de la création : " + err.message);
                    } finally {
                      btn.innerText = '✅ Validé';
                      btn.disabled = false;
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan to-blue-600 text-black font-black text-xs rounded-xl hover:from-cyan/80 hover:to-blue-600/80 transition-all shadow-[0_0_20px_rgba(8,179,201,0.4)] flex items-center gap-2"
                >
                  <span>🚀</span> Valider & Démarrer le Projet
                </button>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="design-btn-trombone transition-all opacity-80 z-20 hover:scale-110"
                title="Joindre un fichier (Stitch/ZIP)"
              >
                📎
              </button>

              <button
                onClick={() => { setActiveProject(null); setNewProjectName(""); setTromboneFiles([]); setIsCreationMode(true); }}
                className="design-btn-new-v0 font-bold flex items-center gap-1 transition-all z-20 hover:scale-105"
                title="Créer un nouveau projet"
              >
                ✨ New-v0
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Système v0-reponses initialisé. L'interface unique est active. Que souhaitez-vous faire ?"
                className="design-chat-input w-full pl-6 pr-14 transition-all shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan"
              />
              <button
                onClick={handleSend}
                className="design-btn-envoi absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>


      {/* MODAL COLOR SAVER 🎨 */}
      {isColorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-6 relative">
            <button onClick={() => setIsColorModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              🎨 Gestion des Thèmes
            </h3>

            {/* BOUTON DÉDIÉ : FIXER LE FOND D'ÉCRAN ELECTRON */}
            <div className="bg-cyan/10 border border-cyan/30 rounded-xl p-4 flex flex-col gap-2">
              <div className="text-xs font-bold text-cyan uppercase tracking-wider flex items-center gap-2">
                <span>🖥️</span> Page d'Accueil Electron
              </div>
              <p className="text-xs text-gray-300">
                Fixer le fond d'écran enregistré ("fold") pour la page d'accueil Electron.
              </p>
              <button
                onClick={() => {
                  const defaultBg = "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #000000 100%)";
                  const updatedThemes = savedThemes.map(t => t.name === "fold" ? { ...t, colors: { ...t.colors, "bg-app": defaultBg } } : t);
                  setSavedThemes(updatedThemes);
                  localStorage.setItem("tiger_saved_themes", JSON.stringify(updatedThemes));
                  setActiveTheme("fold");
                  document.body.style.background = defaultBg;
                  document.body.style.backgroundAttachment = "fixed";
                  fetch("http://localhost:5005/api/theme", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ activeTheme: "fold", bgApp: defaultBg })
                  }).catch(() => { });
                  setIsColorModalOpen(false);
                }}
                className="w-full mt-1 py-2.5 bg-cyan text-black font-extrabold rounded-lg hover:bg-cyan/80 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                🖼️ Appliquer ce Fond d'Écran sur Electron ("fold")
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="text-sm font-bold text-gray-400">Mode actuel : <span className="text-cyan uppercase">{activeTheme}</span></div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Nom (ex: Nuit, Océan, fold...)"
                  className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan"
                />
                <button
                  onClick={saveCurrentTheme}
                  className="px-4 py-2 bg-cyan text-black font-bold rounded-lg hover:bg-cyan/80 transition-colors whitespace-nowrap"
                >
                  Save Mode
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto hide-scrollbar">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Thèmes Enregistrés</div>

              <div
                onClick={() => { setActiveTheme("random"); setIsColorModalOpen(false); }}
                className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${activeTheme === "random" ? "bg-cyan/20 border-cyan text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
              >
                <span className="font-bold flex items-center gap-2">🎲 Mode Aléatoire (Dynamique)</span>
                {activeTheme === "random" && <span className="text-cyan">✓</span>}
              </div>

              <div
                onClick={() => { setActiveTheme("fold"); setIsColorModalOpen(false); }}
                className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${activeTheme === "fold" ? "bg-cyan/20 border-cyan text-white shadow-[0_0_15px_rgba(8,179,201,0.3)]" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
              >
                <span className="font-bold flex items-center gap-2">⚡ Thème FOLD (Fixe Enregistré)</span>
                {activeTheme === "fold" && <span className="text-cyan">✓</span>}
              </div>

              {savedThemes.map((theme, i) => (
                <div
                  key={i}
                  onClick={() => { setActiveTheme(theme.name); setIsColorModalOpen(false); }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${activeTheme === theme.name ? "bg-cyan/20 border-cyan text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-5 h-5 rounded-full shadow-md" style={{ background: theme.colors["icon-settings"] }}></div>
                      <div className="w-5 h-5 rounded-full shadow-md" style={{ background: theme.colors["icon-ai"] }}></div>
                      <div className="w-5 h-5 rounded-full shadow-md" style={{ background: theme.colors["icon-projects"] }}></div>
                    </div>
                    <span className="font-bold">{theme.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTheme === theme.name && <span className="text-cyan">✓</span>}
                    <button
                      onClick={(e) => deleteTheme(theme.name, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      title="Supprimer ce thème"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📱 MODAL COMPILATEUR APK MOBILE (v0-apk) */}
      {isApkModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className="bg-[#090d16] border-2 border-purple-500/60 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.4)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-purple-500/30 bg-[#060910]">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">📱</span>
                <div>
                  <h3 className="text-purple-300 font-black text-base md:text-lg uppercase tracking-wider flex items-center gap-2">
                    v0-apk — Compilateur Mobile Java Portable
                  </h3>
                  <p className="text-xs text-slate-400">Génération d'APK Android Souverain sans dépendance système externe</p>
                </div>
              </div>
              <button
                onClick={() => setIsApkModalOpen(false)}
                className="text-slate-400 hover:text-white bg-white/10 hover:bg-red-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Corps Modal */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
              
              {/* Cible Projet */}
              <div className="flex flex-col gap-2 bg-black/50 p-4 rounded-2xl border border-purple-500/20">
                <label className="text-purple-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                  <span>📁</span> SELECTIONNER L'APPLICATION À COMPILER :
                </label>
                <select
                  value={selectedApkTarget || activeProject || ""}
                  onChange={e => setSelectedApkTarget(e.target.value)}
                  className="w-full bg-[#121824] text-white border border-purple-500/40 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- Sélectionner un projet --</option>
                  {realProjects.map(p => (
                    <option key={p.name} value={p.name}>📁 {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Configuration Build */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-2xl border border-purple-500/20 flex flex-col gap-2">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">☕ Environnement Java</span>
                  <div className="text-xs text-slate-300 bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40 font-mono">
                    JDK Portable 17 + Capacitor Android Engine
                  </div>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-purple-500/20 flex flex-col gap-2">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">🎨 Thèmes Persistent</span>
                  <div className="text-xs text-slate-300 bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40 font-mono">
                    Injection Zero-Touch CSS embarquée
                  </div>
                </div>
              </div>

              {/* Terminal de Build Logs */}
              <div className="bg-[#05070d] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${apkBuildStatus === 'building' ? 'bg-yellow-400 animate-ping' : apkBuildStatus === 'success' ? 'bg-green-400' : 'bg-slate-600'}`}></span>
                    Logs de Compilation APK
                  </span>
                  {apkLogs.length > 0 && (
                    <button
                      onClick={() => setApkLogs([])}
                      className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                    >
                      Effacer logs
                    </button>
                  )}
                </div>
                <div className="bg-black/80 p-3 rounded-xl border border-slate-900 font-mono text-[11px] h-36 overflow-y-auto custom-scrollbar flex flex-col gap-1 text-slate-300">
                  {apkLogs.length === 0 ? (
                    <span className="text-slate-600 italic text-center my-auto">Prêt pour la compilation. Cliquez sur "Compiler l'APK".</span>
                  ) : (
                    apkLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight">{log}</div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                {apkOutputUrl && (
                  <a
                    href={apkOutputUrl}
                    download
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-green-900/40 animate-bounce"
                  >
                    <span>📥</span> Télécharger APK (.apk)
                  </a>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => setIsApkModalOpen(false)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Fermer
                  </button>
                  <button
                    disabled={apkBuildStatus === 'building'}
                    onClick={async () => {
                      const target = selectedApkTarget || activeProject;
                      if (!target) {
                        alert("Veuillez sélectionner un projet à compiler.");
                        return;
                      }
                      setApkBuildStatus('building');
                      setApkLogs([`[v0-apk] 🚀 Démarrage du pipeline pour "${target}"...`]);

                      // Injection directe dans le Terminal Console-V0
                      const appendTerminalLog = (msg: string) => {
                        const term = document.getElementById('mouchard-terminal-logs');
                        if (term) {
                          const line = document.createElement('div');
                          line.className = 'font-mono text-[11px] text-purple-300 py-0.5 border-b border-purple-900/20 flex items-start gap-2';
                          line.innerHTML = `<span class="text-purple-500 font-bold">🖥️ [Console-V0]</span> <span>${msg}</span>`;
                          term.appendChild(line);
                          term.scrollTop = term.scrollHeight;
                        }
                      };

                      appendTerminalLog(`[v0-apk] 🚀 Lancement de la compilation APK pour "${target}"...`);

                      try {
                        const res = await fetch("http://localhost:5005/api/mobile/build-apk", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ project: target })
                        });
                        const data = await res.json();
                        
                        if (data.success) {
                          // Lancement de la boucle d'écoute en temps réel (Polling Console-V0 + Modal)
                          let lastCount = 0;
                          const pollInterval = setInterval(async () => {
                            try {
                              const lRes = await fetch("http://localhost:5005/api/mobile/build-logs");
                              const lData = await lRes.json();
                              if (lData.logs && lData.logs.length > lastCount) {
                                const newLogs = lData.logs.slice(lastCount);
                                lastCount = lData.logs.length;
                                setApkLogs(lData.logs);
                                newLogs.forEach((l: string) => appendTerminalLog(l));
                              }
                              
                              if (!lData.building) {
                                clearInterval(pollInterval);
                                if (lData.result && lData.result.success) {
                                  setApkBuildStatus('success');
                                  if (lData.result.apkUrl) setApkOutputUrl(lData.result.apkUrl);
                                } else {
                                  setApkBuildStatus('error');
                                }
                              }
                            } catch (err) {
                              // Poursuivre le polling
                            }
                          }, 500);
                        } else {
                          setApkBuildStatus('error');
                          setApkLogs(prev => [...prev, `[v0-apk] ⚠️ ${data.message || 'Échec du lancement'}`]);
                          appendTerminalLog(`[v0-apk ⚠️] ${data.message}`);
                        }
                      } catch (e: any) {
                        setApkBuildStatus('idle');
                        setApkLogs(prev => [...prev, `[v0-apk] ℹ️ Erreur réseau lors de la connexion au backend.`]);
                        appendTerminalLog(`[v0-apk ℹ️] Erreur réseau backend.`);
                      }
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50 disabled:opacity-50"
                  >
                    <span>📱</span>
                    <span>{apkBuildStatus === 'building' ? 'Compilation en cours...' : 'COMPILER L\'APK (v0-apk)'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}


      <style dangerouslySetInnerHTML={{
        __html: `
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
