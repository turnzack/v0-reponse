// === Appel Moteur IA Souverain (Cloudflare Workers AI Qwen 3 30B ou DeepSeek) ===

import { SYSTEM_PROMPT } from './system-prompt';
import { buildUserPrompt } from './user-prompt';
import { resolveApiKey } from './api-key-storage';
import type { GeneratedPack, GeneratedFile, PackCategory } from '../../types/pack';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const CLOUDFLARE_WORKER_AI_URL = 'https://kirov-worker.v0reponses.workers.dev/v1/ai/generate';

export async function callHermesAgent(
  idea: string,
  category: PackCategory,
  sourceFolder?: string,
  webUrl?: string
): Promise<GeneratedPack> {
  const apiKey = await resolveApiKey();
  const userPrompt = buildUserPrompt(idea, category, sourceFolder, webUrl);
  const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

  let rawContent = '';

  // 1. Si une clé API DeepSeek est disponible, tenter DeepSeek
  if (apiKey && apiKey.length > 5) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 8000,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        rawContent = data.choices?.[0]?.message?.content ?? '';
      }
    } catch {
      console.warn('[AI Provider] DeepSeek indisponible, bascule vers Cloudflare Workers AI.');
    }
  }

  // 2. Fallback Souverain Gratuit : Cloudflare Workers AI (Qwen 3 30B)
  if (!rawContent) {
    const token = localStorage.getItem('kirov5_jwt_token') || '';
    const cfRes = await fetch(CLOUDFLARE_WORKER_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        missionId: 'guest_prd_generation',
        lotId: 'lot_001'
      })
    });

    if (!cfRes.ok) {
      throw new Error(`Erreur du moteur IA Cloudflare (${cfRes.status}). Réessayez dans un instant.`);
    }

    const cfData = await cfRes.json();
    rawContent = cfData.response || cfData.choices?.[0]?.message?.content || '';
  }

  if (!rawContent) {
    throw new Error('Réponse vide de l\'Agent Hermes. Réessayez.');
  }

  // Parser le JSON retourné par l'agent
  let parsed: any;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
  } catch {
    throw new Error(`L'Agent Hermes n'a pas retourné un JSON valide. Réponse: ${rawContent.slice(0, 300)}`);
  }

  // Construire le GeneratedPack typé
  const folderName: string = parsed.folderName || `guest_${idea.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}`;
  const injectFileName = `inject_${folderName}.js`;

  // Construire la liste de fichiers de base
  const baseFiles: GeneratedFile[] = [
    {
      path: 'README.md',
      language: 'markdown',
      purpose: 'PRD complet avec 10 modules architecturaux et directives IA',
      content: parsed.readme_content || '',
    },
    {
      path: injectFileName,
      language: 'javascript',
      purpose: 'Script d\'injection avec PRDS détaillés pour Tiger IA / Hermes',
      content: parsed.inject_content || '',
    },
    {
      path: 'manifest.json',
      language: 'json',
      purpose: 'Métadonnées et registre du pack PRD',
      content: typeof parsed.manifest_content === 'string'
        ? parsed.manifest_content
        : JSON.stringify(parsed.manifest_content ?? {}, null, 2),
    },
  ];

  if (category === 'game' || parsed.game_engine_config || parsed.extra_files) {
    if (parsed.game_engine_config || !parsed.extra_files) {
      baseFiles.push(
        {
          path: 'project_spec.yaml',
          language: 'yaml',
          purpose: 'Contrat de Spécification du Projet',
          content: typeof parsed.project_spec === 'string'
            ? parsed.project_spec
            : JSON.stringify(parsed.project_spec || {
                schema_version: "1.0.0",
                project: {
                  id: folderName,
                  name: parsed.projectName || folderName,
                  genre: "platformer_or_arcade"
                }
              }, null, 2),
        },
        {
          path: 'action_plan.yaml',
          language: 'yaml',
          purpose: 'Graphe de Dépendances & Micro-Actions Granulaires',
          content: typeof parsed.action_plan === 'string'
            ? parsed.action_plan
            : JSON.stringify(parsed.action_plan || {
                schema_version: "1.0.0",
                actions: []
              }, null, 2),
        }
      );
    }
  }

  const pack: GeneratedPack = {
    projectName: parsed.projectName || folderName.replace('guest_', '').replace(/_/g, ' ').toUpperCase(),
    folderName,
    title: `Pack PRD ${parsed.projectName || folderName}`,
    category: parsed.category || category,
    ideaSummary: parsed.ideaSummary || idea,
    architectureSummary: parsed.architectureSummary || 'Architecture React 18 + TypeScript + Vite + Tailwind CSS.',
    tasks: parsed.tasks || [
      { id: 'task-1', title: 'Structure du Projet', description: 'Initialisation React/Vite/TypeScript', priority: 'must-have', status: 'planned' },
      { id: 'task-2', title: 'Composants Core', description: 'Développement des vues principales', priority: 'must-have', status: 'planned' },
    ],
    files: baseFiles,
    extensionPoints: parsed.extensionPoints || ['React Context', 'Custom Hooks', 'TypeScript'],
    warnings: parsed.warnings || [],
  };

  return pack;
}
