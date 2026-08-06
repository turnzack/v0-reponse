"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";

type WidgetType = "projects" | "settings" | "news" | "youtube" | "phases" | null;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  widget?: WidgetType;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Système Tiger IA initialisé. L'interface unique est active. Que souhaitez-vous faire ?",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Simulation des phases de création
  const [activePhase, setActivePhase] = useState(1);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    
    const lowerInput = input.toLowerCase();
    
    setTimeout(() => {
      let responseMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };

      if (lowerInput.includes("projet")) {
        responseMsg.content = "Voici la liste de vos projets récents :";
        responseMsg.widget = "projects";
      } else if (lowerInput.includes("youtube")) {
        responseMsg.content = "Voici les résultats YouTube pour votre recherche :";
        responseMsg.widget = "youtube";
      } else if (lowerInput.includes("actualité") || lowerInput.includes("ia")) {
        responseMsg.content = "Voici les dernières actualités sur l'Intelligence Artificielle :";
        responseMsg.widget = "news";
      } else if (lowerInput.includes("paramètre") || lowerInput.includes("reglage") || lowerInput.includes("configuration")) {
        responseMsg.content = "Ouverture du panneau de configuration système :";
        responseMsg.widget = "settings";
      } else if (lowerInput.includes("crée") || lowerInput.includes("lance")) {
        responseMsg.content = "Initialisation du pipeline de création G5 en 11 phases. Démarrage...";
        responseMsg.widget = "phases";
        
        // Simuler l'avancement des phases
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

      } else {
        responseMsg.content = "Traitement de votre demande via Tiger IA...";
        // Call bridge if available
        if (typeof window !== "undefined" && (window as any).AndroidBridge) {
          (window as any).AndroidBridge.openAIWithPrompt("https://chat.deepseek.com/", input);
        }
      }

      setMessages((prev) => [...prev, responseMsg]);
    }, 600);

    setInput("");
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

  const WidgetProjects = () => {
    const projects = [
      { name: "TCE Réponse", desc: "Pipeline G5, React + Vite", bg: "bg-gradient-to-br from-blue-900 to-cyan-900" },
      { name: "Sovereign Mobile", desc: "Capacitor, Android Bridge", bg: "bg-gradient-to-br from-teal-900 to-green-900" },
      { name: "Electron Desktop", desc: "Windows x64, Node.js", bg: "bg-gradient-to-br from-purple-900 to-pink-900" },
      { name: "UI Vercel", desc: "Next.js, TailwindCSS", bg: "bg-gradient-to-br from-gray-800 to-black" },
    ];
    return renderCarousel(projects.map(p => (
      <div className={`w-64 h-40 ${p.bg} rounded-2xl p-5 border border-white/20 shadow-xl flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-0" />
        <div className="z-10 relative">
          <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">PROJET</div>
          <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
        </div>
        <div className="z-10 relative text-sm text-cyan font-medium">{p.desc}</div>
      </div>
    )));
  };

  const WidgetNews = () => {
    const news = [
      { title: "DeepSeek V3", desc: "Le nouveau modèle surpasse GPT-4 sur les tests logiques.", tag: "LLM" },
      { title: "React 19", desc: "Le compilateur React est enfin disponible en version beta.", tag: "Frontend" },
      { title: "Next.js 15", desc: "Mise à jour majeure du cache et de l'architecture App Router.", tag: "Framework" },
    ];
    return renderCarousel(news.map(n => (
      <div className="w-72 h-48 bg-glassDark rounded-2xl p-5 border border-white/10 backdrop-blur-md flex flex-col hover:border-cyan/50 transition-colors shadow-lg">
        <span className="self-start px-2 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-md mb-3">{n.tag}</span>
        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{n.title}</h3>
        <p className="text-gray-400 text-sm flex-1">{n.desc}</p>
        <button className="text-cyan text-sm font-semibold hover:underline self-end">Lire l&apos;article →</button>
      </div>
    )));
  };

  const WidgetYouTube = () => {
    const videos = [
      { title: "Créer une IA Souveraine", channel: "Tiger Channel", views: "1.2k" },
      { title: "React Tailwind Masterclass", channel: "UI Design", views: "5.4k" },
      { title: "Android Bridge Capacitor", channel: "Mobile Dev", views: "800" },
    ];
    return renderCarousel(videos.map(v => (
      <div className="w-64 bg-black/60 rounded-2xl overflow-hidden border border-red-500/30 hover:border-red-500 transition-colors shadow-lg">
        <div className="h-32 bg-gray-800 relative flex items-center justify-center">
          {/* Placeholder d'image vidéo avec icône play */}
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

  const WidgetSettings = () => {
    return (
      <div className="w-full max-w-lg bg-glassDark rounded-2xl p-6 border border-white/10 shadow-2xl mt-2 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink/20 blur-[50px] rounded-full"></div>
        <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
          <span className="text-pink">⚙️</span> Configuration Système
        </h3>
        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
            <span className="text-gray-200 font-medium">AutoPilot G5</span>
            <div className="w-12 h-6 bg-cyan/20 rounded-full relative cursor-pointer border border-cyan/50">
              <div className="absolute right-1 top-1 w-4 h-4 bg-cyan rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
            <span className="text-gray-200 font-medium">LLM Principal</span>
            <select className="bg-black/50 text-white border border-white/20 rounded-lg px-3 py-1 outline-none">
              <option>DeepSeek V3</option>
              <option>Gemma 2</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
            <span className="text-gray-200 font-medium">Mode Furtif (Bridge)</span>
            <div className="w-12 h-6 bg-cyan/20 rounded-full relative cursor-pointer border border-cyan/50">
              <div className="absolute right-1 top-1 w-4 h-4 bg-cyan rounded-full"></div>
            </div>
          </div>
          <button className="w-full py-3 mt-2 bg-gradient-to-r from-pink to-purple-600 rounded-xl text-white font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all">
            Enregistrer les Paramètres
          </button>
        </div>
      </div>
    );
  };

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
          
          let cardBg = "bg-glass border-white/10 opacity-50"; // Attente
          if (isDone) cardBg = "bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/50 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
          if (isCurrent) cardBg = "bg-gradient-to-br from-cyan/20 to-blue-900/40 border-cyan text-white shadow-[0_0_20px_rgba(8,179,201,0.5)] animate-pulse";

          return (
            <div className={`w-40 h-48 rounded-2xl p-4 border flex flex-col justify-between transition-all duration-500 ${cardBg}`}>
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
            </div>
          );
        }))}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-gta-sunset flex flex-col overflow-hidden relative">
      <Head>
        <title>Tiger IA - Sovereign Chat UI</title>
      </Head>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/10 z-10 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(8,179,201,0.4)]">
            <span className="text-xl">🐯</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wider">TIGER IA</h1>
            <p className="text-xs text-cyan font-medium">OS Souverain v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Connecté</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 hide-scrollbar flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 pb-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl ${
                msg.role === "user" 
                  ? "bg-gradient-to-r from-cyan to-blue-600 text-white font-medium rounded-br-sm shadow-[0_4px_20px_rgba(8,179,201,0.3)]" 
                  : "bg-glassDark border border-white/10 rounded-bl-sm text-gray-200 shadow-xl"
              }`}>
                {msg.content}
              </div>
              
              {/* Dynamic Widgets Injected into Chat */}
              {msg.widget === "projects" && <WidgetProjects />}
              {msg.widget === "news" && <WidgetNews />}
              {msg.widget === "youtube" && <WidgetYouTube />}
              {msg.widget === "settings" && <WidgetSettings />}
              {msg.widget === "phases" && <WidgetPhases />}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-black/40 backdrop-blur-xl border-t border-white/10 z-10">
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Demandez à Tiger IA (ex: 'Mes projets', 'Actualités IA', 'Ouvre YouTube')..." 
            className="w-full bg-white/5 border border-white/10 rounded-full pl-6 pr-16 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan focus:bg-white/10 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-full flex items-center justify-center hover:bg-cyan hover:text-white transition-colors shadow-lg"
          >
            <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </div>
      </footer>

      {/* Styles globaux pour cacher les scrollbars mais garder la fonctionnalité */}
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
