// ==============================================================================
// CLOUD APK BUILDER SOUVERAIN (GITHUB ACTIONS AUTO-PILOT)
// Déclenche et supervise la compilation APK dans le Cloud sans ouvrir GitHub
// ==============================================================================

const GITHUB_REPO = 'turnzack/v0-reponse';
const GITHUB_WORKFLOW = 'build-apk.yml';
const GITHUB_TOKEN = typeof window !== 'undefined' ? (localStorage.getItem('tiger_github_pat') || '') : '';

export interface CloudBuildStatus {
  status: 'idle' | 'queued' | 'in_progress' | 'completed' | 'failed';
  logs: string[];
  apkDownloadUrl: string | null;
  runId?: number;
}

/**
 * Lance automatiquement la compilation Cloud et suit sa progression
 */
export async function launchCloudApkBuild(
  projectName: string,
  onLog: (message: string) => void,
  onStatusChange: (status: 'building' | 'success' | 'error', apkUrl?: string) => void
): Promise<void> {
  const cleanProject = projectName || 'AUDIO';
  const startTime = Date.now();

  onLog(`> 🚀 Initialisation de la compilation Cloud pour [${cleanProject}]...`);
  onLog(`> 🌐 Connexion au cluster de build souverain (GitHub Cloud Engine)...`);

  try {
    // 1. Déclenchement du workflow GitHub Actions via l'API REST
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Tiger-Auto-Apk-Engine'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            project_name: cleanProject,
            app_label: cleanProject
          }
        })
      }
    );

    if (!dispatchRes.ok && dispatchRes.status !== 204) {
      const err = await dispatchRes.text();
      throw new Error(`Erreur API Cloud (${dispatchRes.status}): ${err}`);
    }

    onLog(`> ⚡ Ordre de compilation validé par le Cloud (Job Dispatch OK).`);
    onLog(`> ⏳ Attribution d'un conteneur dédié (Ubuntu 22.04 LTS + JDK 17 + Android SDK)...`);

    // 2. Attente de la création du Run
    let runId: number | null = null;
    let attempts = 0;

    while (!runId && attempts < 15) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      const runsRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?event=workflow_dispatch&per_page=5`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (runsRes.ok) {
        const data = await runsRes.json();
        const latestRun = data.workflow_runs?.[0];
        if (latestRun && new Date(latestRun.created_at).getTime() >= startTime - 10000) {
          runId = latestRun.id;
          onLog(`> 📋 Tâche Cloud assignée : Run #${runId}`);
        }
      }
    }

    if (!runId) {
      onLog(`> ℹ️ Compilation lancée en arrière-plan dans le Cloud.`);
      onStatusChange('building');
      return;
    }

    // 3. Polling du statut et des étapes
    let completed = false;
    let pollCount = 0;

    while (!completed && pollCount < 120) {
      await new Promise(r => setTimeout(r, 4000));
      pollCount++;

      const checkRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!checkRes.ok) continue;
      const runData = await checkRes.json();
      const status = runData.status; // queued, in_progress, completed
      const conclusion = runData.conclusion; // success, failure, cancelled

      if (status === 'queued') {
        onLog(`> ⏳ En file d'attente sur les serveurs de build...`);
      } else if (status === 'in_progress') {
        if (pollCount % 3 === 0) {
          onLog(`> ⚙️ Compilation native en cours (Assemblage Gradle Dex + Assets)...`);
        }
      } else if (status === 'completed') {
        completed = true;
        if (conclusion === 'success') {
          onLog(`> ✅ Compilation native réussie à 100 % !`);
          onLog(`> 📦 Génération du lien de téléchargement direct de l'APK...`);

          // 4. Récupérer l'artifact de l'APK
          const artRes = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}/artifacts`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (artRes.ok) {
            const artData = await artRes.json();
            const artifact = artData.artifacts?.[0];
            if (artifact) {
              const downloadUrl = `https://github.com/${GITHUB_REPO}/actions/runs/${runId}/artifacts/${artifact.id}`;
              onLog(`> 🎉 APK prêt ! Téléchargez votre application ci-dessous.`);
              onStatusChange('success', downloadUrl);
              return;
            }
          }

          onStatusChange('success', `https://github.com/${GITHUB_REPO}/actions/runs/${runId}`);
          return;
        } else {
          onLog(`> ❌ La compilation Cloud s'est terminée avec le statut : ${conclusion}`);
          onStatusChange('error');
          return;
        }
      }
    }

  } catch (err: any) {
    onLog(`> ❌ Erreur lors du déclenchement Cloud : ${err.message}`);
    onStatusChange('error');
  }
}
