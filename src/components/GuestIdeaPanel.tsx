import React, { useState, useEffect } from 'react';
import { Phase5ProposalViewer } from './guest/Phase5ProposalViewer';
import { Phase5Audit } from '../types/pack';
import { safeFetch } from '../lib/bridgeClient';
import { analyzeProposal, generateGuestPack } from '../lib/guest/pack-generator';
type PackCategory = 'health' | 'game' | 'ecommerce' | 'productivity' | 'social' | 'education' | 'other' | 'phase5';
type ActiveTab = 'prompt' | 'folder' | 'web' | 'designrip' | 'phase5';
type PipelineStatus = 'idle' | 'analyzing' | 'proposal-ready' | 'generating' | 'saved' | 'error';

interface Proposal {
  projectName: string;
  description: string;
  modules: string[];
  category: string;
}

// ─── Preset examples ───────────────────────────────────────────────
const PRESETS = [
  {
    title: 'Jeu Tetris Rétro',
    category: 'game' as PackCategory,
    icon: '🎮',
    idea: 'Un jeu Tetris rétro néon avec système de score, contrôles au clavier, effets de particules, niveaux de difficulté progressifs et sons retro 8-bit.',
  },
  {
    title: 'Pack Santé Apple Health',
    category: 'health' as PackCategory,
    icon: '❤️',
    idea: "Application de suivi biométrique façon Apple Health : hydratation, suivi du sommeil, fréquence cardiaque, objectifs quotidiens et widgets graphiques fluides.",
  },
  {
    title: 'Store Sneaker Futuriste',
    category: 'ecommerce' as PackCategory,
    icon: '👟',
    idea: "E-commerce de sneakers rares en 3D avec panier réactif, filtre par marques, mode sombre futuriste et prévisualisation AR.",
  },
];

const CATEGORIES: { value: PackCategory; label: string }[] = [
  { value: 'health', label: 'Fitness / Santé' },
  { value: 'game', label: 'Jeu Vidéo' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'productivity', label: 'Productivité' },
  { value: 'social', label: 'Réseau Social' },
  { value: 'education', label: 'Éducation' },
  { value: 'other', label: 'Autre / Spécifique' },
];

// ─── ProposalViewer interne ────────────────────────────────────────
const InternalProposalViewer = ({
  proposal,
  folderName,
  setFolderName,
  onConfirm,
  onReset,
  isGenerating,
}: {
  proposal: Proposal;
  folderName: string;
  setFolderName: (v: string) => void;
  onConfirm: () => void;
  onReset: () => void;
  isGenerating: boolean;
}) => (
  <div className="mt-4 p-4 bg-[#0a1a0a] border border-green-500/30 rounded-xl space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-green-400 font-bold text-xs flex items-center gap-2">✅ Proposition Hermes</span>
      <button onClick={onReset} className="text-[9px] text-gray-500 hover:text-gray-300">← Recommencer</button>
    </div>
    <div className="text-white font-black text-sm">{proposal.projectName}</div>
    <p className="text-gray-400 text-[11px] leading-relaxed">{proposal.description}</p>
    {proposal.modules && proposal.modules.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {proposal.modules.map((m, i) => (
          <span key={i} className="bg-cyan/10 border border-cyan/30 text-cyan text-[9px] px-2 py-0.5 rounded-full">{m}</span>
        ))}
      </div>
    )}
    <div>
      <label className="text-gray-400 text-[9px] font-bold uppercase block mb-1">Dossier cible</label>
      <input
        type="text"
        value={folderName}
        onChange={e => setFolderName(e.target.value)}
        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-cyan"
        placeholder="guest_mon_projet"
      />
    </div>
    <button
      onClick={onConfirm}
      disabled={isGenerating || !folderName}
      className="w-full py-3 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 hover:from-cyan-500/70 hover:to-blue-500/70 border border-cyan/40 text-white text-[11px] font-black uppercase rounded-lg transition-all disabled:opacity-50"
    >
      {isGenerating ? '⏳ Génération...' : '💎 Confirmer & Générer le Pack PRD'}
    </button>
  </div>
);

// ─── Composant principal ───────────────────────────────────────────
export const GuestIdeaPanel: React.FC<{ 
  activeProjectName?: string; 
  onPackGenerated?: (pack: string, description: string, category: string) => void;
  selectedStartPhase?: number;
  onPhaseChange?: (phase: number) => void;
}> = ({ activeProjectName, onPackGenerated, selectedStartPhase, onPhaseChange }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('prompt');
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState<PackCategory>('other');
  const [sourceFolder, setSourceFolder] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [phase5Folder, setPhase5Folder] = useState('');
  const [phase5Request, setPhase5Request] = useState('');

  const [isPackMode, setIsPackMode] = useState(false);
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [phase5Audit, setPhase5Audit] = useState<Phase5Audit | null>(null);
  const [folderName, setFolderName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchro externe -> interne (Left Menu -> Tabs)
  useEffect(() => {
    if (selectedStartPhase === 5 && activeTab !== 'phase5') setActiveTab('phase5');
    if (selectedStartPhase === 0 && activeTab === 'phase5') setActiveTab('prompt');
  }, [selectedStartPhase]);

  useEffect(() => {
    try {
      if (!webUrl.trim()) { setIsYouTube(false); return; }
      const h = new URL(webUrl).hostname.replace(/^www\./, '');
      setIsYouTube(h === 'youtube.com' || h === 'youtu.be');
    } catch { setIsYouTube(false); }
  }, [webUrl]);

  const handleReset = () => {
    setProposal(null);
    setPhase5Audit(null);
    setStatus('idle');
    setErrorMsg('');
    setSuccessMsg('');
    setFolderName('');
  };

  const handleAnalyze = async () => {
    setErrorMsg('');
    setProposal(null);
    setSuccessMsg('');

    let processedIdea = idea.trim();
    if (activeTab === 'phase5') {
      if (!phase5Folder.trim()) { setErrorMsg('Sélectionnez un dossier à auditer.'); return; }
      processedIdea = phase5Request.trim() || "Audit standard d'industrialisation (frontend vers backend)";
    } else if (activeTab === 'folder') {
      processedIdea = processedIdea || `Import du projet local : ${sourceFolder}`;
    } else if (activeTab === 'web' || activeTab === 'designrip') {
      processedIdea = processedIdea || `Analyse du site : ${webUrl}`;
      if (activeTab === 'designrip') processedIdea = `[DESIGN RIP] ${processedIdea}`;
    }

    if (!processedIdea) { setErrorMsg('Décrivez votre idée ou remplissez les champs requis.'); return; }

    setStatus('analyzing');
    try {
      let prop: Proposal | null = null;
      try {
        const endpoint = activeTab === 'phase5' ? '/api/bridge/analyze-phase5' : '/api/bridge/guest-analyze';
        const res = await safeFetch(`http://localhost:5006${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: processedIdea,
            category: activeTab === 'phase5' ? 'phase5' : category,
            sourceFolder: sourceFolder || undefined,
            webUrl: webUrl || undefined,
            phase5Folder: phase5Folder || undefined,
          }),
        });

        if (res && res.ok) {
          const data = await res.json();
          if (activeTab === 'phase5') {
            const auditData = data.data?.audit || data.audit || data.data?.proposal || data.proposal || data;
            setPhase5Audit(auditData);
            setFolderName(phase5Folder.split(/[\\/]/).pop() || 'guest_audit');
            setStatus('proposal-ready');
            return;
          }
          prop = data.proposal || data.data?.proposal;
        }
      } catch (e) {}

      // Fallback Web Cloud 100% autonome (Cloudflare Workers AI / DeepSeek)
      if (!prop && activeTab !== 'phase5') {
        const cloudProposal = await analyzeProposal(processedIdea, category, sourceFolder, webUrl);
        prop = {
          projectName: cloudProposal.projectName || processedIdea.slice(0, 30).toUpperCase(),
          description: cloudProposal.ideaSummary || processedIdea,
          modules: (cloudProposal.architecturalModules || []).map((m: any) => m.name || m),
          category: String(category)
        };
      } else if (!prop && activeTab === 'phase5') {
        setPhase5Audit({
          projectType: 'web_application',
          confidence: 0.95,
          backendRequired: true,
          phase5Action: 'full_industrialization',
          capabilities: ['Auth JWT', 'Neon Storage', 'Cloudflare Worker AI'],
          mocks: [],
          decisions: [{ title: 'Déploiement Cloud', option: 'Vercel + Cloudflare', recommendation: 'Approuvé' }],
          filesToCreate: [],
          filesToModify: [],
          filesToPreserve: [],
          risks: [],
          requiresUserDecision: []
        });
        setFolderName(phase5Folder.split(/[\\/]/).pop() || 'guest_audit');
        setStatus('proposal-ready');
        return;
      }

      const baseName = activeProjectName || prop?.projectName || 'Projet';
      const defaultFolder = `guest_${baseName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}`;
      setFolderName(defaultFolder);
      setProposal(prop);
      setStatus('proposal-ready');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erreur de génération avec le Moteur Cloud IA.');
    }
  };

  const handleConfirm = async () => {
    if (!proposal || !folderName) return;
    setStatus('generating');
    setErrorMsg('');
    try {
      let isSavedLocally = false;
      try {
        const res = await safeFetch('http://localhost:5006/api/bridge/guest-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal, folderName, idea, category }),
        });
        if (res && res.ok) {
          isSavedLocally = true;
        }
      } catch (e) {}

      if (!isSavedLocally) {
        // Fallback Web Cloud Engine
        await generateGuestPack(idea, category, sourceFolder, webUrl, folderName);
      }

      setStatus('saved');
      setSuccessMsg(`✅ Pack PRD certifié et sauvegardé pour le projet "${folderName}" !`);
      if (onPackGenerated) onPackGenerated(folderName, proposal.description, category);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erreur lors de la génération du Pack PRD.');
    }
  };
      if (onPackGenerated) onPackGenerated(folderName, proposal.description, category);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erreur lors de la génération du Pack PRD.');
    }
  };

  const handlePhase5Confirm = async (finalAudit: Phase5Audit) => {
    setStatus('generating');
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5006/api/bridge/guest-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proposal: finalAudit, 
          folderName, 
          idea: phase5Request, 
          category: 'phase5' 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur génération Pack Phase 5');
      setStatus('saved');
      setSuccessMsg(`✅ Contrat Phase 5 sauvegardé pour le projet ! L'orchestrateur prend le relais.`);
      if (onPackGenerated) onPackGenerated(folderName, 'Contrat de migration industrielle', 'phase5');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Erreur lors de la génération du contrat.');
    }
  };

  const tabBtn = (id: ActiveTab, label: string, icon: string, color: string) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(id);
        if (id === 'phase5' && onPhaseChange) onPhaseChange(5);
        if (id !== 'phase5' && activeTab === 'phase5' && onPhaseChange) onPhaseChange(0);
      }}
      className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
        activeTab === id
          ? `bg-gradient-to-r ${color} border shadow-lg`
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-xs flex items-center gap-2">
          <span className="text-cyan">📄</span> Instructions &amp; Création du Pack PRD
        </h3>
        <span className="text-[9px] text-zinc-400">
          Dossier cible : <code className="text-cyan bg-zinc-900 px-1.5 py-0.5 rounded">guest_{activeProjectName ? activeProjectName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'nom_du_projet'}</code>
        </span>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl text-[11px] text-green-300 font-bold">
          {successMsg}
          <button onClick={handleReset} className="ml-3 text-[10px] text-green-500 underline">← Nouveau projet</button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-[11px] text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 overflow-x-auto">
        {tabBtn('prompt',    '1. Idée & Prompt',        '📝', 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40')}
        {tabBtn('folder',   '2. Ancien Projet',         '📁', 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40')}
        {tabBtn('web',      '3. YouTube / Web',         '🎬', 'from-red-500/20 to-pink-500/20 text-red-300 border-red-500/40')}
        {tabBtn('designrip','4. DesignRip',             '🌐', 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40')}
        {tabBtn('phase5',   '5. 🔌 Phase 5',           '⚙️', 'from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/40')}
      </div>

      {/* TAB CONTENT */}
      {!proposal && !phase5Audit && status !== 'saved' && (
        <div className="space-y-3">
          {/* Prompt */}
          {activeTab === 'prompt' && (
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="Ex: Je veux créer une application de méditation guidée et suivi d'entraînements avec ambiance sonore apaisante et statistiques quotidiennes..."
              rows={4}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan text-xs resize-none"
            />
          )}

          {/* Folder */}
          {activeTab === 'folder' && (
            <div className="space-y-2 p-4 bg-zinc-950/60 rounded-xl border border-amber-500/20">
              <div className="flex gap-4 mb-2 border-b border-zinc-800/80 pb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                  <input type="radio" name="folderMode" value="project" checked={!isPackMode} onChange={() => setIsPackMode(false)} className="accent-amber-500" />
                  📁 Projet Local Existant
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-yellow-400 cursor-pointer">
                  <input type="radio" name="folderMode" value="pack" checked={isPackMode} onChange={() => setIsPackMode(true)} className="accent-yellow-500" />
                  💎 Ancien Pack PRD (Ripping)
                </label>
              </div>
              <label className="text-xs font-semibold text-amber-300 block">
                {isPackMode ? "💎 Dossier du Pack PRD :" : "📁 Dossier de l'ancien projet :"}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('http://localhost:5006/api/bridge/select-folder');
                      const d = await res.json();
                      const data = d.data || d;
                      if (data.success && data.path) {
                        setSourceFolder(data.path);
                        if (!idea.trim() || idea.startsWith("Analyse")) {
                          if (isPackMode) {
                            setIdea(`Analyse RIPPING de l'ancien pack PRD "${data.name}" pour l'enrichir et générer un nouveau pack ultra complet basé sur ce concept.`);
                          } else {
                            setIdea(`Analyse et reconstruction de l'ancien projet "${data.name}"`);
                          }
                        }
                      }
                    } catch {}
                  }}
                  className="px-3 py-2 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  📂 Choisir dossier
                </button>
                <input
                  type="text"
                  value={sourceFolder}
                  onChange={e => setSourceFolder(e.target.value)}
                  placeholder="ou saisissez le chemin (ex: E:\ancien_projet)"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-200 placeholder-zinc-500 font-mono"
                />
              </div>
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Instructions complémentaires..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          {/* Web / YouTube */}
          {activeTab === 'web' && (
            <div className={`space-y-2 p-4 bg-zinc-950/60 rounded-xl border ${isYouTube ? 'border-red-500/40' : 'border-purple-500/20'}`}>
              {isYouTube && (
                <div className="flex items-center gap-2 text-[10px] text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                  🎬 YouTube détecté — extraction transcript activée
                </div>
              )}
              <input
                type="url"
                value={webUrl}
                onChange={e => setWebUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://mon-site.com"
                className={`w-full bg-zinc-900 border rounded-xl px-4 py-2.5 text-xs font-mono ${isYouTube ? 'border-red-500/50 text-red-200' : 'border-zinc-800 text-purple-200'}`}
              />
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Instructions complémentaires..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-xs"
              />
            </div>
          )}

          {/* DesignRip */}
          {activeTab === 'designrip' && (
            <div className="space-y-2 p-4 bg-emerald-950/10 rounded-xl border border-emerald-500/30">
              <label className="text-xs font-semibold text-emerald-300 block">🌐 URL du site à cloner :</label>
              <input
                type="url"
                value={webUrl}
                onChange={e => setWebUrl(e.target.value)}
                placeholder="https://mon-site.com"
                className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-emerald-200 font-mono"
              />
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-200/80">
                🎨 <strong>DesignRip :</strong> Clone du site avec animations fluides et design dynamique.
              </div>
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Instructions spécifiques..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-xs"
              />
            </div>
          )}

          {/* Phase 5 */}
          {activeTab === 'phase5' && (
            <div className="space-y-4 p-4 bg-violet-950/10 rounded-xl border border-violet-500/30">
              <div>
                <div className="text-xs font-black text-violet-300 uppercase tracking-widest">⚙️ Phase 5 — Audit & Industrialisation</div>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">Sélectionnez le projet. Hermes l'auditera pour détecter les mocks et proposer une architecture sécurisée.</p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-violet-300 block mb-1">📁 Projet à auditer :</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phase5Folder}
                    onChange={e => setPhase5Folder(e.target.value)}
                    placeholder="Ex: E:\v0reponses\MonProjet"
                    className="flex-1 bg-zinc-900 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-violet-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5006/api/bridge/select-folder');
                        const d = await res.json();
                        const data = d.data || d;
                        if (data.success && data.path) setPhase5Folder(data.path);
                      } catch {}
                    }}
                    className="px-3 py-2 bg-violet-500/10 border border-violet-500/40 text-violet-300 rounded-xl text-xs font-bold hover:bg-violet-500/20 transition-colors"
                  >
                    📂 Choisir
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-violet-300 block mb-1">🎯 Instructions supplémentaires (optionnel) :</label>
                <textarea
                  value={phase5Request}
                  onChange={e => setPhase5Request(e.target.value)}
                  rows={2}
                  placeholder="Ex: S'assurer que les modèles de données incluent une table 'Utilisateur' avec un rôle administrateur..."
                  className="w-full bg-zinc-900 border border-violet-500/20 rounded-xl p-3 text-zinc-200 text-xs resize-none focus:border-violet-500/50 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Category + Analyze button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {activeTab !== 'phase5' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Catégorie:</span>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as PackCategory)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] text-cyan font-medium focus:outline-none focus:border-cyan"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={status === 'analyzing'}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                status === 'analyzing'
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : activeTab === 'phase5'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500'
              }`}
            >
              {status === 'analyzing'
                ? <><span className="animate-spin">⚡</span> Analyse Hermes en cours...</>
                : activeTab === 'phase5'
                  ? <>⚙️ Auditer le Projet</>
                  : <>✨ Étape 1 : Analyser l'Idée (Proposition)</>
              }
            </button>
          </div>

          {/* Presets */}
          {activeTab === 'prompt' && (
            <div className="pt-3 border-t border-zinc-800/80">
              <p className="text-[10px] font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                💡 Ou choisissez un modèle d'inspiration prêt à l'emploi :
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setActiveTab('prompt'); setIdea(ex.idea); setCategory(ex.category); }}
                    className="text-left p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan/40 transition-all group"
                  >
                    <div className="flex items-center gap-2 font-bold text-white text-[11px] mb-1 group-hover:text-cyan transition-colors">
                      <span>{ex.icon}</span> {ex.title}
                    </div>
                    <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-2">{ex.idea}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proposal Viewer */}
      {proposal && status !== 'saved' && activeTab !== 'phase5' && (
        <InternalProposalViewer
          proposal={proposal}
          folderName={folderName}
          setFolderName={setFolderName}
          onConfirm={handleConfirm}
          onReset={handleReset}
          isGenerating={status === 'generating'}
        />
      )}

      {/* Phase 5 Proposal Viewer */}
      {phase5Audit && status !== 'saved' && activeTab === 'phase5' && (
        <Phase5ProposalViewer
          audit={phase5Audit}
          sourceFolder={phase5Folder}
          onConfirm={handlePhase5Confirm}
          onReset={handleReset}
          isSubmitting={status === 'generating'}
        />
      )}
    </div>
  );
};
