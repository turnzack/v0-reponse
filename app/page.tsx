"use client";

import React, { useState } from "react";
import Head from "next/head";

export default function Dashboard() {
  const [activePhase, setActivePhase] = useState(1);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Moteur Tiger IA prêt. Entrez votre prompt pour générer l'architecture souveraine." }
  ]);
  const [input, setInput] = useState("");

  const phases = [
    "Analyse & Setup", "Génération Index", "Génération React",
    "Génération CSS", "Fichiers Utilitaires", "Configuration Vite",
    "Tests & Lint", "Package.json", "Vérification Finale",
    "Bridge Node.js", "Build Automatique"
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    
    // Appel du Bridge Natif Android (si disponible)
    if (typeof window !== "undefined" && window.AndroidBridge) {
      window.AndroidBridge.openAIWithPrompt("https://chat.deepseek.com/", input);
    } else {
      setMessages(msgs => [...msgs, { role: "assistant", content: "⚠️ AndroidBridge non détecté (Mode Web). Vous êtes sur un PC ?" }]);
    }
    
    setInput("");
  };

  // Ecoute des retours de capture depuis le Phantom Script Android
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TIGER_CAPTURE') {
        const code = event.data.data;
        setMessages(msgs => [...msgs, { 
          role: "assistant", 
          content: "✅ Code Capturé (" + code.length + " caractères) ! Prêt pour la Phase 3 (Écriture locale)." 
        }]);
        // TODO: Appeler @capacitor/filesystem ici pour écrire
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-gta-sunset text-white flex flex-col items-center">
      <Head>
        <title>Tiger IA - Sovereign Dashboard</title>
      </Head>

      {/* Main Glass Container - Responsive width */}
      <div className="w-full max-w-5xl flex-1 bg-glassDark sm:rounded-none md:rounded-2xl md:my-6 md:border md:border-tealMuted/30 shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar - Phase Tracker (Hidden on small screens by default, or stacked) */}
        <aside className="w-full md:w-1/3 bg-black/40 border-b md:border-b-0 md:border-r border-tealMuted/30 p-6 flex flex-col h-auto md:h-full overflow-y-auto">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-extrabold bg-tiger-gradient bg-clip-text text-transparent tracking-wider">
              TIGER IA
            </h1>
            <p className="text-orange font-medium mt-1">Sovereign G5 Orchestrator</p>
          </div>

          <div className="flex-1">
            <h2 className="text-cyan font-bold mb-4 uppercase tracking-wider text-sm">G5 Pipeline (11 Phases)</h2>
            <div className="flex flex-col gap-3">
              {phases.map((phase, index) => {
                const step = index + 1;
                const isActive = activePhase === step;
                const isPast = step < activePhase;
                return (
                  <div 
                    key={step} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive ? "bg-glass border-cyan shadow-[0_0_15px_rgba(8,179,201,0.5)]" :
                      isPast ? "bg-tealDark/20 border-tealDark/40 opacity-70" :
                      "bg-black/20 border-white/10 opacity-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isActive ? "bg-cyan text-black" : 
                      isPast ? "bg-tealDark text-white" : 
                      "bg-white/10"
                    }`}>
                      {step}
                    </div>
                    <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-300"}`}>
                      {phase}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Main Content - Chat & Controls */}
        <main className="flex-1 flex flex-col h-[60vh] md:h-auto">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-cyan font-bold">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
              Bridge Serveur Connecté
            </div>
            <button className="px-4 py-2 bg-pink/20 text-pink hover:bg-pink/40 border border-pink/50 rounded-full text-xs font-bold transition-all">
              🔧 Configurer LLM
            </button>
          </div>

          {/* Chat Zone */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-cyan text-black font-semibold rounded-br-none" 
                    : "bg-glass border border-cyan/30 rounded-bl-none text-gray-100 shadow-[0_0_15px_rgba(16,111,142,0.3)]"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Zone */}
          <div className="p-4 md:p-6 bg-black/40 border-t border-tealMuted/20">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Décrivez votre application..." 
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
              />
              <button 
                onClick={handleSend}
                className="bg-gradient-to-r from-cyan to-tealDark w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(8,179,201,0.4)] border-none"
              >
                <svg className="w-5 h-5 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center gap-4 mt-4">
              <button className="flex-1 py-2 bg-violetLight/20 hover:bg-violetLight/40 text-violetLight border border-violetLight/50 rounded-xl font-bold text-sm transition-all">
                💉 Forcer Injection
              </button>
              <button className="flex-1 py-2 bg-orange/20 hover:bg-orange/40 text-orange border border-orange/50 rounded-xl font-bold text-sm transition-all">
                📦 Forcer Capture
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
