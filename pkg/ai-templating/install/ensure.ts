import { isAdminUser } from '@shell/store/type-map';
import { AGENT_CRS, SEED_CONFIGMAPS } from './manifests';

// Auto-install the extension's cluster dependencies when an admin loads it: the AIAgentConfig
// builder agents, plus a seed config + default Home ConfigMap so the custom Home works out of the
// box. Templates are ConfigMaps (not a CRD) because the Rancher AI MCP server can only write a
// fixed allow-list of kinds — ConfigMaps are on it, custom CRDs are not — which is what lets the
// AI agents actually edit them. Idempotent (skips anything already present) and admin-gated.

const AGENT_TYPE = 'ai.cattle.io.aiagentconfig';
const CONFIGMAP_TYPE = 'configmap';

let ranThisSession = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureExists(store: any, type: string, metadata: any, body: any): Promise<boolean> {
  const ns = metadata?.namespace;
  const id = ns ? `${ ns }/${ metadata.name }` : metadata.name;

  if (store.getters['management/byId'](type, id)) {
    return false;
  }

  const res = await store.dispatch('management/create', {
    type, metadata, ...body
  });

  await res.save();

  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureInstalled(store: any): Promise<void> {
  if (ranThisSession || !isAdminUser(store.getters)) {
    return;
  }
  ranThisSession = true;

  try {
    // 1. AIAgentConfig builder agents (only if the ai.cattle.io CRD is present).
    if (store.getters['management/schemaFor'](AGENT_TYPE)) {
      await store.dispatch('management/findAll', { type: AGENT_TYPE }).catch(() => {});

      for (const agent of AGENT_CRS) {
        await ensureExists(store, AGENT_TYPE, agent.metadata, { spec: agent.spec }).catch(() => {});
      }
    }

    // 2. Seed the config singleton + a default Home ConfigMap so the custom Home works immediately.
    if (store.getters['management/schemaFor'](CONFIGMAP_TYPE)) {
      for (const cm of SEED_CONFIGMAPS) {
        await ensureExists(store, CONFIGMAP_TYPE, cm.metadata, { data: cm.data }).catch(() => {});
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[ai-templating] ensureInstalled failed', e);
  }
}
