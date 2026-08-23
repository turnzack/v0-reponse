import { GeneratedPack, PackCategory, Phase5Audit } from '../../types/pack';
import { AnalysisProposal } from '../../components/guest/ProposalViewer';
import { callHermesAgent } from './ai-provider';
import { resolveApiKey } from './api-key-storage';
import { SYSTEM_PROMPT } from './system-prompt';
import { buildUserPrompt } from './user-prompt';
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzeUserPrompt, PHASE5_ANALYZE_SYSTEM_PROMPT, buildPhase5AuditPrompt } from './analyze-prompt';

export type IntelligenceMode = 'api' | 'extension-web';

/** Récupère le transcript depuis le cache bridge (envoyé par l'extension KIROV5) */
async function fetchYouTubeTranscriptFromBridge(webUrl: string) {
  try {
    const res = await fetch(`http://localhost:5006/api/bridge/youtube-context?url=${encodeURIComponent(webUrl)}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = payload.data || payload;
    if (data.found && data.fullContext) return data;
    return null;
  } catch {
    return null;
  }
}

/** Envoie un prompt dans DeepSeek via le bridge KIROV5 (mode Extension Web) et attend la capture */
async function generateViaExtensionWeb(fullPrompt: string, timeoutMs = 180000): Promise<string> {
  const BRIDGE = 'http://localhost:5006';

  // 1. Envoyer le prompt dans la file du bridge (target: deepseek)
  const sendRes = await fetch(`${BRIDGE}/v1/bridge/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      target_ai: 'deepseek',
      auto_submit: true,
      project_id: 'guest_pack_generation'
    })
  });
  if (!sendRes.ok) throw new Error(`Bridge inject failed: ${sendRes.status}`);

  // 2. Polling — attendre la capture de la réponse DeepSeek
  const pollInterval = 3000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, pollInterval));
    try {
      const pollRes = await fetch(`${BRIDGE}/v1/bridge/last-capture?target_ai=deepseek`);
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        const data = pollData.data || pollData;
        if (data.content && data.content.length > 100) {
          return data.content;
        }
      }
    } catch { /* continuer */ }
  }

  throw new Error('Timeout : DeepSeek (Extension Web) n\'a pas répondu dans les délais.');
}

/** Parse la réponse JSON brute de l'IA en pack structuré */
function parsePackFromContent(content: string, folderName: string): GeneratedPack {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse IA.');
  const parsed = JSON.parse(jsonMatch[0]);

  let files = [];
  
  if (Array.isArray(parsed.files)) {
    files = parsed.files.map((file: any) => ({
      path: String(file.path),
      language: file.language || 'text',
      purpose: file.purpose || 'Pack PRD',
      required: file.required !== false,
      content: typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2)
    }));
  } else {
    // Fallback legacy
    if (parsed.readme_content) files.push({ path: 'README.md', language: 'markdown' as const, purpose: 'PRD principal', content: parsed.readme_content });
    const injectName = `inject_${(parsed.folderName || folderName).replace('guest_', '')}.js`;
    if (parsed.inject_content) files.push({ path: injectName, language: 'javascript' as const, purpose: 'Script d\'injection des PRDs', content: parsed.inject_content });
    if (parsed.manifest_content) {
      const manifestStr = typeof parsed.manifest_content === 'string' ? parsed.manifest_content : JSON.stringify(parsed.manifest_content, null, 2);
      files.push({ path: 'manifest.json', language: 'json' as const, purpose: 'Manifest du pack', content: manifestStr });
    }
  }

  return {
    projectName: parsed.projectName || folderName,
    folderName: parsed.folderName || folderName,
    title: parsed.projectName || folderName,
    category: parsed.category || 'other',
    ideaSummary: parsed.ideaSummary || '',
    architectureSummary: parsed.architectureSummary || '',
    tasks: parsed.tasks || [],
    files,
    extensionPoints: parsed.extensionPoints || [],
    warnings: parsed.warnings || []
  };
}

export async function analyzeProposal(
  idea: string,
  category: PackCategory = 'other',
  sourceFolder?: string,
  webUrl?: string,
  intelligenceMode: IntelligenceMode = 'api'
): Promise<AnalysisProposal> {
  // ============================================================
  // MODE EXTENSION WEB — Injection dans DeepSeek via KIROV5
  // ============================================================
  if (intelligenceMode === 'extension-web') {
    console.log('[Pack Generator] 🩵 Mode Extension Web activé — Analyse via DeepSeek...');

    let ytData: { title?: string; transcript?: string; description?: string } | null = null;
    if (webUrl) {
      ytData = await fetchYouTubeTranscriptFromBridge(webUrl);
    }

    const userPrompt = buildAnalyzeUserPrompt(idea, category, sourceFolder, webUrl, ytData);
    const fullPrompt = `${ANALYZE_SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

    const rawContent = await generateViaExtensionWeb(fullPrompt);
    
    // Parse JSON
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse IA.');
    return JSON.parse(jsonMatch[0]) as AnalysisProposal;
  }

  // ============================================================
  // MODE API — Hermes Agent DeepSeek
  // ============================================================
  const apiKey = await resolveApiKey();

  try {
    const res = await fetch('http://localhost:5006/api/bridge/analyze-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {})
      },
      body: JSON.stringify({
        idea,
        category,
        source_folder: sourceFolder,
        web_url: webUrl,
        apiKey: apiKey || undefined
      }),
    });

    if (res.ok) {
      const payload = await res.json();
      const data = payload.data || payload;
      if (data.success && data.proposal) return data.proposal;
      throw new Error(`Réponse API invalide : ${data.message || payload.message || 'Données manquantes'}`);
    } else {
      const errText = await res.text();
      throw new Error(`Échec de l'analyse IA (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.warn('[Pack Generator] Bridge analyze-proposal indisponible.', err);
    throw err;
  }
}

export async function generateGuestPack(
  idea: string,
  category: PackCategory = 'other',
  sourceFolder?: string,
  webUrl?: string,
  customFolderName?: string,
  intelligenceMode: IntelligenceMode = 'api'
): Promise<GeneratedPack> {

  const slugifiedIdea = (customFolderName || (sourceFolder
    ? sourceFolder.replace(/\\/g, '/').split('/').pop()
    : idea
  ))?.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35) ?? 'project';
  const folderName = customFolderName || (slugifiedIdea.startsWith('guest_') ? slugifiedIdea : `guest_${slugifiedIdea}`);

  // ============================================================
  // MODE EXTENSION WEB — Injection dans DeepSeek via KIROV5
  // ============================================================
  if (intelligenceMode === 'extension-web') {
    console.log('[Pack Generator] 🩵 Mode Extension Web activé — Injection dans DeepSeek...');

    // 1. Récupérer le transcript YouTube si disponible (depuis le cache bridge)
    let ytData: { title?: string; transcript?: string; description?: string } | null = null;
    if (webUrl) {
      ytData = await fetchYouTubeTranscriptFromBridge(webUrl);
      if (ytData?.transcript) {
        console.log(`[Pack Generator] ⚡ Transcript YouTube récupéré depuis le cache (${ytData.transcript.split(/\\s+/).length} mots)`);
      }
    }

    // 2. Construire le prompt complet (System + User avec transcript)
    const userPrompt = buildUserPrompt(idea, category, sourceFolder, webUrl, ytData);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

    // 3. Envoyer dans DeepSeek via l'extension KIROV5 et attendre la réponse
    const rawContent = await generateViaExtensionWeb(fullPrompt);

    // 4. Sauvegarder sur disque via bridge
    try {
      const saveRes = await fetch('http://localhost:5006/api/bridge/save-guest-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawContent, folder_name: folderName })
      });
      if (saveRes.ok) console.log('[Pack Generator] ✅ Pack sauvegardé sur disque via bridge.');
    } catch { /* non-bloquant */ }

    // 5. Parser et retourner le pack
    return parsePackFromContent(rawContent, folderName);
  }

  // ============================================================
  // MODE API — Hermes Agent DeepSeek (mode historique)
  // ============================================================
  const apiKey = await resolveApiKey();
  try {
    const res = await fetch('http://localhost:5006/api/bridge/generate-guest-pack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {})
      },
      body: JSON.stringify({
        idea, category,
        folder_name: folderName,
        source_folder: sourceFolder,
        web_url: webUrl,
        apiKey: apiKey || undefined
      }),
    });

    if (res.ok) {
      const payload = await res.json();
      const data = payload.data || payload;
      if (data.success && data.pack) return data.pack;
      throw new Error(`Réponse API invalide : ${data.message || payload.message || 'Données manquantes'}`);
    } else {
      const errText = await res.text();
      throw new Error(`Échec de la génération de Pack PRD (${res.status}): ${errText}`);
    }
  } catch (hermesErr) {
    console.warn('[Pack Generator] Bridge 5006 indisponible ou en erreur.', hermesErr);
    throw hermesErr;
  }
}

// ============================================================
// PHASE 5 — Audit & Industrialisation Souveraine
// ============================================================

/** Valide la structure minimale d'un audit Phase5 */
function validatePhase5Shape(parsed: any): void {
  if (!parsed || typeof parsed !== 'object') throw new Error('Réponse Phase5 invalide : pas un objet JSON.');
  if (!parsed.projectClassification?.primaryType) throw new Error('Phase5 : projectClassification.primaryType manquant.');
  if (!Array.isArray(parsed.capabilities)) throw new Error('Phase5 : capabilities doit être un tableau.');
}

/** Parse et normalise la réponse JSON brute de Hermes en Phase5Audit */
export function parsePhase5Audit(rawContent: string): Phase5Audit {
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Aucun JSON valide trouvé dans la réponse d\'audit Phase5.');
  
  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('JSON Phase5 malformé — impossible de parser la réponse Hermes.');
  }

  validatePhase5Shape(parsed);

  return {
    projectType: parsed.projectClassification?.primaryType || 'unknown',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    backendRequired: parsed.backendRequired !== false,
    phase5Action: parsed.phase5Action || 'full_industrialization',
    capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : [],
    mocks: Array.isArray(parsed.mockInventory) ? parsed.mockInventory : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    filesToCreate: Array.isArray(parsed.filesToCreate) ? parsed.filesToCreate : [],
    filesToModify: Array.isArray(parsed.filesToModify) ? parsed.filesToModify : [],
    filesToPreserve: Array.isArray(parsed.filesToPreserve) ? parsed.filesToPreserve : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    requiresUserDecision: Array.isArray(parsed.requiresUserDecision) ? parsed.requiresUserDecision : []
  };
}

/** Lance l'audit Phase5 via Hermes */
export async function analyzePhase5Audit(
  sourceFolder: string,
  request: string,
  intelligenceMode: IntelligenceMode = 'api'
): Promise<Phase5Audit> {
  // Étape 1 : Récupérer le snapshot sécurisé du projet depuis le moteur Electron
  let projectSnapshot = '(snapshot non disponible — moteur hors ligne)';
  try {
    const snapRes = await fetch('http://localhost:5006/api/fs/project-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: sourceFolder })
    });
    if (snapRes.ok) {
      const snapData = await snapRes.json();
      const data = snapData.data || snapData;
      if (data.snapshot) projectSnapshot = JSON.stringify(data.snapshot, null, 2);
    }
  } catch {
    console.warn('[Phase5] Snapshot indisponible — audit en mode dégradé.');
  }

  const userPrompt = buildPhase5AuditPrompt({ projectFolder: sourceFolder, request, projectSnapshot });

  // Étape 2 : Audit via Hermes
  if (intelligenceMode === 'extension-web') {
    const fullPrompt = `${PHASE5_ANALYZE_SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;
    const rawContent = await generateViaExtensionWeb(fullPrompt, 240000);
    return parsePhase5Audit(rawContent);
  }

  // Mode API (Hermes Agent)
  const apiKey = await resolveApiKey();
  try {
    const res = await fetch('http://localhost:5006/api/bridge/phase5-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {})
      },
      body: JSON.stringify({
        projectId: sourceFolder,
        request,
        project_snapshot: projectSnapshot,
        system_prompt: PHASE5_ANALYZE_SYSTEM_PROMPT,
        apiKey: apiKey || undefined
      })
    });

    if (res.ok) {
      const payload = await res.json();
      const data = payload.data || payload;
      if (payload.success && data.audit) return data.audit as Phase5Audit;
      // Fallback : parser la réponse brute
      if (data.rawContent) return parsePhase5Audit(data.rawContent);
      throw new Error(`Réponse audit invalide : ${payload.message || data.message || 'données manquantes'}`);
    } else {
      const errText = await res.text();
      throw new Error(`Échec audit Phase5 (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.warn('[Phase5] Bridge phase5-audit indisponible.', err);
    throw err;
  }
}

/** Envoie le contrat Phase5 confirmé au moteur Kirov5 pour exécution */
export async function launchPhase5(
  decision: {
    projectId: string;
    sourceFolder: string;
    audit: Phase5Audit;
    confirmedAt: string;
    confirmedBy: string;
  }
): Promise<{ jobId?: string; status?: string; message?: string }> {
  const KIROV_API_URL = (import.meta as any).env?.VITE_KIROV_API_URL || 'http://localhost:5006';

  const res = await fetch(`${KIROV_API_URL}/api/bridge/phase5`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: decision.projectId,
      // Ne pas envoyer sourceFolder libre — le moteur recalcule depuis projectId
      decision
    })
  });

  let payload: any = {};
  try { payload = await res.json(); } catch { /* body vide */ }

  // 202 — Job lancé de façon asynchrone (long running)
  if (res.status === 202) {
    return { status: 'accepted', jobId: payload?.data?.jobId || `pending-${Date.now()}`, message: 'Job Phase5 lancé en arrière-plan' };
  }

  // 409 — Gate bloquante ou drift détecté
  if (res.status === 409) {
    const err = Object.assign(
      new Error(payload?.code || payload?.message || 'Phase 5 bloquée par une gate de sécurité'),
      { code: payload?.code || 'PHASE5_GATE_BLOCKED', data: payload?.data }
    );
    throw err;
  }

  // 422 — Audit ou décision invalide
  if (res.status === 422) {
    throw Object.assign(
      new Error(payload?.message || 'Contrat Phase 5 invalide'),
      { code: payload?.code || 'PHASE5_INVALID_DECISION' }
    );
  }

  // Autres erreurs (500, 503…)
  if (!res.ok) {
    throw Object.assign(
      new Error(payload?.message || `Erreur moteur Kirov5 (${res.status})`),
      { code: payload?.code || 'PHASE5_FAILED' }
    );
  }

  // 200 — Résultat immédiat
  const data = payload.data || payload;
  return { jobId: data.jobId, status: data.status || 'completed', message: data.message };
}
