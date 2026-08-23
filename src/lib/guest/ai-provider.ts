// === Appel Direct à l'API DeepSeek depuis le navigateur ===
// La clé API est fournie par l'utilisateur et stockée en localStorage uniquement.

import { SYSTEM_PROMPT } from './system-prompt';
import { buildUserPrompt } from './user-prompt';
import { resolveApiKey } from './api-key-storage';
import type { GeneratedPack, GeneratedFile, PackCategory } from '../../types/pack';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function callHermesAgent(
  idea: string,
  category: PackCategory,
  sourceFolder?: string,
  webUrl?: string
): Promise<GeneratedPack> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('Clé API DeepSeek non configurée. Cliquez sur ⚙️ pour configurer votre clé.');
  }

  const userPrompt = buildUserPrompt(idea, category, sourceFolder, webUrl);

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

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401) {
      throw new Error('Clé API DeepSeek invalide ou expirée. Vérifiez votre clé dans les paramètres.');
    }
    if (response.status === 429) {
      throw new Error('Limite de requêtes DeepSeek atteinte. Réessayez dans quelques instants.');
    }
    throw new Error(`Erreur API DeepSeek (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawContent: string = data.choices?.[0]?.message?.content ?? '';

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

  // Si c'est un pack Gamer / Jeu Vidéo, inclure les fichiers spécialisés du Master Pack Gamer
  if (category === 'game' || parsed.game_engine_config || parsed.extra_files) {
    if (parsed.game_engine_config || !parsed.extra_files) {
      baseFiles.push(
        {
          path: 'project_spec.yaml',
          language: 'yaml',
          purpose: 'Contrat de Spécification du Projet & Cibles de Performance (State-Controlled Store)',
          content: typeof parsed.project_spec === 'string'
            ? parsed.project_spec
            : JSON.stringify(parsed.project_spec || {
                schema_version: "1.0.0",
                project: {
                  id: folderName,
                  name: parsed.projectName || folderName,
                  genre: "platformer_or_arcade",
                  dimension: parsed.readme_content?.includes('Three.js') ? "3d" : "2d",
                  camera: parsed.readme_content?.includes('Three.js') ? "orbit_or_pointerlock" : "side_scroller",
                  target_stack: {
                    frontend: "vite-react-typescript",
                    renderer: parsed.readme_content?.includes('Three.js') ? "threejs_r3f" : "canvas2d",
                    ui: "react-tailwind",
                    audio: "web_audio_api"
                  },
                  targets: ["web", "mobile_web"]
                },
                viewport: {
                  logical_resolution: { width: 1280, height: 720 },
                  aspect_ratio: "16:9",
                  high_dpi_scaling: true
                },
                performance_targets: {
                  desktop: { target_fps: 60, minimum_fps: 50 },
                  mobile: { target_fps: 60, minimum_fps: 30 }
                },
                systems_required: [
                  "core_runtime", "canvas_renderer", "aabb_physics",
                  "input_abstraction", "game_state_machine", "level_manager",
                  "sprite_animation", "web_audio", "react_hud"
                ]
              }, null, 2),
        },
        {
          path: 'action_plan.yaml',
          language: 'yaml',
          purpose: 'Graphe de Dépendances & Micro-Actions Granulaires avec Fichiers Autorisés/Interdits',
          content: typeof parsed.action_plan === 'string'
            ? parsed.action_plan
            : JSON.stringify(parsed.action_plan || {
                schema_version: "1.0.0",
                actions: [
                  {
                    id: "1.A", phase: 1, title: "Initialiser le Core Engine et Viewport",
                    status: "planned", dependencies: [],
                    files_allowed: ["src/game/runtime/GameRuntime.ts", "src/game/rendering/Renderer.ts"],
                    files_forbidden: ["src/game/audio/**", "src/ui/**"],
                    acceptance_criteria: ["Résolution logique 16:9 respectée", "Boucle requestAnimationFrame fonctionnelle à 60 FPS"]
                  },
                  {
                    id: "2.B", phase: 2, title: "Physique & Collisions AABB / Gravité",
                    status: "planned", dependencies: ["1.A"],
                    files_allowed: ["src/game/physics/PhysicsSystem.ts", "src/game/entities/PlayerEntity.ts"],
                    files_forbidden: ["src/game/camera/**", "src/ui/**"],
                    acceptance_criteria: ["Gravité déterministe avec DeltaTime", "Aucun travers de plateforme (tunneling)"]
                  }
                ]
              }, null, 2),
        },
        {
          path: 'previsualization_spec.json',
          language: 'json',
          purpose: 'Phase 0 Pre-Viz Maquette Nano Banana (Layout Viewport 16:9, HUD & Composition)',
          content: typeof parsed.previsualization_spec === 'string'
            ? parsed.previsualization_spec
            : JSON.stringify(parsed.previsualization_spec || {
                previewId: "nano-banana-previz-001",
                viewport: { width: 1280, height: 720, aspectRatio: "16:9", orientation: "landscape" },
                camera: { type: "side-scroller", position: "center-left-tracking" },
                hud: [
                  { element: "HealthBar", anchor: "TopLeft" },
                  { element: "ScoreCounter", anchor: "TopRight" },
                  { element: "JoypadVirtual", anchor: "BottomLeft" },
                  { element: "ActionButton", anchor: "BottomRight" }
                ],
                visualReferences: [
                  { type: "Mockup", function: "Valider ergonomie et composition visual" },
                  { type: "Prototype", function: "Formes géométriques simples pour gameplay" },
                  { type: "ProductionAsset", function: "Sprites et modèles optimisés finaux" }
                ]
              }, null, 2),
        },
        {
          path: 'game_engine_config.json',
          language: 'json',
          purpose: 'Configuration Moteur (Canvas 2D / WebGL R3F, FPS, Physique, Gravity)',
          content: typeof parsed.game_engine_config === 'string'
            ? parsed.game_engine_config
            : JSON.stringify(parsed.game_engine_config || {
                targetFPS: 60,
                renderer: parsed.readme_content?.includes('Three.js') ? 'WebGL_R3F' : 'Canvas2D',
                physics: { gravity: { x: 0, y: 9.8 }, collisionType: 'AABB' },
                viewport: { width: 1280, height: 720, responsive: true }
              }, null, 2),
        },
        {
          path: 'assets_manifest.json',
          language: 'json',
          purpose: 'Catalogue des Assets 2D/3D & Prompts IA (Meshy AI / Leonardo AI)',
          content: typeof parsed.assets_manifest === 'string'
            ? parsed.assets_manifest
            : JSON.stringify(parsed.assets_manifest || {
                models3D: ["character_player.glb", "environment_level.glb"],
                sprites2D: ["paddle.png", "ball.png", "bricks_sheet.png"],
                aiPrompts: {
                  meshy3D: "Cyberpunk neon breakout ball, low-poly 3D asset, game ready",
                  leonardo2D: "8-bit retro arcade background, seamless tileable texture"
                }
              }, null, 2),
        },
        {
          path: 'audio_synth_presets.json',
          language: 'json',
          purpose: 'Presets Fréquences Web Audio API (Bruitages 8-bit & SFX Synth)',
          content: typeof parsed.audio_synth_presets === 'string'
            ? parsed.audio_synth_presets
            : JSON.stringify(parsed.audio_synth_presets || {
                sounds: {
                  hit: { type: "square", freqStart: 440, freqEnd: 880, duration: 0.1 },
                  bounce: { type: "sine", freqStart: 220, freqEnd: 110, duration: 0.15 },
                  explosion: { type: "sawtooth", freqStart: 150, freqEnd: 40, duration: 0.3 },
                  powerup: { type: "triangle", freqStart: 523, freqEnd: 1046, duration: 0.25 }
                }
              }, null, 2),
        },
        {
          path: 'levels_data.json',
          language: 'json',
          purpose: 'Cartographie des Niveaux (Level Maps, Tilesets & Auto-Tiling)',
          content: typeof parsed.levels_data === 'string'
            ? parsed.levels_data
            : JSON.stringify(parsed.levels_data || {
                levels: [
                  { level: 1, name: "Initiation Néon", rows: 4, cols: 8, speedMultiplier: 1.0, tileSet: "cyberpunk_blocks" },
                  { level: 2, name: "Boss Rush", rows: 6, cols: 10, speedMultiplier: 1.25, tileSet: "metallic_hazards" }
                ]
              }, null, 2),
        },
        {
          path: 'physics_rigidbody_config.json',
          language: 'json',
          purpose: 'Physique & Collisions (Rigidbodies, Triggers, Raycasts, Character Controller)',
          content: typeof parsed.physics_rigidbody_config === 'string'
            ? parsed.physics_rigidbody_config
            : JSON.stringify(parsed.physics_rigidbody_config || {
                collisionLayers: ["Player", "Enemies", "Projectiles", "Environment", "Triggers"],
                characterController: { stepOffset: 0.3, slopeLimit: 45, gravityScale: 1.0 },
                raycasting: { maxDistance: 100, defaultMask: "Environment" }
              }, null, 2),
        },
        {
          path: 'animation_blend_tree.json',
          language: 'json',
          purpose: 'Moteur d\'Animation (Squelettes, IK/FK, Blend Trees & Sequencer Cinématique)',
          content: typeof parsed.animation_blend_tree === 'string'
            ? parsed.animation_blend_tree
            : JSON.stringify(parsed.animation_blend_tree || {
                stateMachines: {
                  locomotion: {
                    type: "BlendTree2D",
                    parameters: ["Speed", "Direction"],
                    states: ["Idle", "Walk", "Run", "Jump", "Fall"]
                  }
                }
              }, null, 2),
        },
        {
          path: 'ui_canvas_layouts.json',
          language: 'json',
          purpose: 'Système UI/UX (Canvas Responsive, HUD Overlay & Thèmes)',
          content: typeof parsed.ui_canvas_layouts === 'string'
            ? parsed.ui_canvas_layouts
            : JSON.stringify(parsed.ui_canvas_layouts || {
                canvasMode: "ScreenSpaceOverlay",
                responsiveAnchors: ["TopLeft_HUD", "BottomCenter_Abilities", "Center_Modals"],
                transitions: { fadeDurationMs: 250, slideEasing: "cubic-bezier(0.4, 0, 0.2, 1)" }
              }, null, 2),
        }
      );
    }
    if (Array.isArray(parsed.extra_files)) {
      parsed.extra_files.forEach((f: any) => {
        if (f.path && f.content) {
          baseFiles.push({
            path: f.path,
            language: f.language || 'json',
            purpose: f.purpose || 'Fichier étendu du Pack Gamer',
            content: typeof f.content === 'string' ? f.content : JSON.stringify(f.content, null, 2)
          });
        }
      });
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
      { id: 'task-3', title: 'Design System', description: 'Thème sombre et animations', priority: 'should-have', status: 'planned' },
    ],
    files: baseFiles,
    extensionPoints: parsed.extensionPoints || ['React Context', 'Custom Hooks', 'TypeScript', 'Electron Bridge Port 5006'],
    warnings: parsed.warnings || [],
  };

  return pack;
}
