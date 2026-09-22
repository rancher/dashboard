// Runtime template engine (extension edition) — ConfigMap storage.
//
// Home templates, the applied-Home dashboard and the kill-switch config are stored as labeled
// ConfigMaps in the local cluster's `default` namespace, read via the MANAGEMENT store (Steve
// `/v1/`). ConfigMaps are used (instead of a templating.rancher.io CRD) because the Rancher AI MCP
// server can only write a fixed allow-list of kinds — ConfigMaps are on it, custom CRDs are not — so
// this is what lets the AI agents actually edit templates. A code template's SFC lives in
// data['view.vue']; a JSON template's widgets live in data.template.

import { migrateToView } from './view-model';

// ---- ConfigMap storage ----
export const CONFIGMAP = 'configmap';
export const TEMPLATE_NAMESPACE = 'default';

// One marker label selects every templating ConfigMap (so we load only these, not the whole cluster);
// a type label distinguishes them.
// Keeps the old name on purpose. This label is ON the stored ConfigMaps — every saved panel, every
// template, the kill switch — so renaming it orphans all of them.
export const LABEL_MARKER = 'templates.rancher.io/ai-templating';
export const LABEL_TYPE = 'templates.rancher.io/type';
export const TYPE_HOME = 'home-template';
export const TYPE_CONFIG = 'config';

// ConfigMap data keys.
export const SFC_KEY = 'view.vue'; // the Vue SFC (what the AI edits)

// The kill-switch ConfigMap (data.enabled only).
export const CONFIG_NAME = 'templating-config';
export const CONFIG_ID = `${ TEMPLATE_NAMESPACE }/${ CONFIG_NAME }`;

// The applied-Home dashboard lives in its OWN ConfigMap (data.home), SEPARATE from the kill switch,
// so the home-builder agent can write the Home freely with zero risk of flipping data.enabled.
export const HOME_CONFIG_NAME = 'templating-home';
export const HOME_CONFIG_ID = `${ TEMPLATE_NAMESPACE }/${ HOME_CONFIG_NAME }`;

// This extension's product + route names (kept here so product.ts and routing/index.ts agree).
export const PRODUCT_NAME = 'configurable-views';
export const ROUTE_SETTINGS = 'configurable-views-settings';
export const ROUTE_TEMPLATES = 'configurable-views-templates';
export const ROUTE_LAYOUTS = 'configurable-views-layouts';

// ---- ConfigMap helpers ----
function safeParse(str, fallback) {
  if (!str) {
    return fallback;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function labelOf(cm, key) {
  return cm?.metadata?.labels?.[key];
}

/** Every templating ConfigMap currently in the management store cache (marker-labeled). */
function templatingCMs(getters) {
  return (getters['management/all']?.(CONFIGMAP) || []).filter((cm) => labelOf(cm, LABEL_MARKER) === 'true');
}

function cmsOfType(getters, type) {
  return templatingCMs(getters).filter((cm) => labelOf(cm, LABEL_TYPE) === type);
}

function cmById(getters, name) {
  return getters['management/byId']?.(CONFIGMAP, `${ TEMPLATE_NAMESPACE }/${ name }`) ||
    templatingCMs(getters).find((cm) => cm.metadata?.name === name);
}

const homeLabels = { [LABEL_MARKER]: 'true', [LABEL_TYPE]: TYPE_HOME };
const configLabels = { [LABEL_MARKER]: 'true', [LABEL_TYPE]: TYPE_CONFIG };

// ---- GLOBAL KILL SWITCH (config ConfigMap) ----
// data.enabled === 'false' disables everything. Absent, or 'true', means enabled (the default).
export function isTemplatingEnabled(getters) {
  const cm = cmById(getters, CONFIG_NAME);

  return !cm || cm.data?.enabled !== 'false';
}

/** Flip (or set) the kill switch, then re-register nav. */
export async function toggleTemplating(store, enabled) {
  const desired = typeof enabled === 'boolean' ? enabled : !isTemplatingEnabled(store.getters);
  const existing = cmById(store.getters, CONFIG_NAME);

  if (existing) {
    existing.data = { ...(existing.data || {}), enabled: desired ? 'true' : 'false' };
    await existing.save();
  } else {
    const cm = await store.dispatch('management/create', {
      type:     CONFIGMAP,
      metadata: {
        name: CONFIG_NAME, namespace: TEMPLATE_NAMESPACE, labels: configLabels
      },
      data: { enabled: desired ? 'true' : 'false' },
    });

    await cm.save();
  }

  return desired;
}

// ---- VIEW resolution (the applied Home VIEW) ----
// The stored config is { global: <View>, users: { <uid>: <View> } }. A View is { panels: [ { id,
// name, widgets } ] } — see templating/view-model.js for the vocabulary.
function homeConfig(getters) {
  const homeCm = cmById(getters, HOME_CONFIG_NAME);

  if (homeCm?.data?.home !== undefined) {
    return safeParse(homeCm.data.home, {});
  }

  // Legacy fallback: the applied Home used to live in the kill-switch ConfigMap. Keep reading it so
  // existing installs work until the next save moves it into templating-home.
  return safeParse(cmById(getters, CONFIG_NAME)?.data?.home, {});
}

/** The raw applied-Home config object ({ global, users }) — for the manual YAML editor. */
export function getHomeConfig(getters) {
  return homeConfig(getters);
}

/** Persist a raw applied-Home config object (from the manual YAML editor). */
export async function saveHomeConfig(store, home) {
  await persistHome(store, home || {});
}

/** All saved Home templates (normalized) for the editor's picker. */
export function savedHomeTemplates(getters) {
  return cmsOfType(getters, TYPE_HOME).map((cm) => ({
    metadata: cm.metadata,
    spec:     { displayName: cm.data?.displayName || cm.metadata?.name, source: cm.data?.[SFC_KEY] || cm.data?.source || '' },
  }));
}

/**
 * Resolve a template (by ConfigMap name) to what a TEMPLATE node needs to render it:
 *   - kind 'code' → a Vue SFC compiled in the browser (`source`)
 *   - kind 'json' → declarative `widgets` ({ type, ...config })
 */
export function templateByName(getters, name) {
  const cm = cmById(getters, name);

  if (!cm) {
    return {
      kind: 'missing', source: '', widgets: []
    };
  }

  const d = cm.data || {};
  const kind = d.kind || 'code';

  if (kind === 'code') {
    return {
      kind: 'code', source: d[SFC_KEY] || d.source || '', widgets: []
    };
  }

  const tpl = safeParse(d.template, null);

  return {
    kind: 'json', source: '', widgets: tpl?.pages?.[0]?.widgets || tpl?.widgets || []
  };
}

/** Persist a JSON (widget) home template: data.kind='template', data.template={pages:[{widgets}]}. */
export async function saveTemplateJson(store, { name, widgets, displayName }) {
  const existing = cmById(store.getters, name);
  const tpl = {
    pages: [{
      id: name, name: displayName || name, widgets: widgets || []
    }]
  };
  const data = {
    kind: 'template', template: JSON.stringify(tpl), displayName: displayName || name
  };

  if (existing && labelOf(existing, LABEL_TYPE) === TYPE_HOME) {
    existing.data = { ...(existing.data || {}), ...data };
    await existing.save();

    return existing;
  }

  const cm = await store.dispatch('management/create', {
    type:     CONFIGMAP,
    metadata: {
      name, namespace: TEMPLATE_NAMESPACE, labels: homeLabels
    },
    data,
  });

  await cm.save();

  return cm;
}

/**
 * Applied Home VIEWS split by scope + the one THIS user actually sees (user overrides global).
 * `global`/`user` are null when that scope has nothing applied; `resolved` is the migrated view
 * (or null) the user should see. Legacy shapes (tabs[] of grid panels, or a bare template name) are
 * migrated on read by migrateToView.
 */
export function appliedViewScopes(getters, userId) {
  const home = homeConfig(getters);
  const rawGlobal = home.global || null;
  const rawUser = (userId && home.users?.[userId]) || null;

  // global/user are the stored views (returned as-is for EDITING, even when disabled). `resolved` is
  // what actually RENDERS: a disabled view is skipped (the scope falls back), so a user pick
  // overrides global, but only enabled ones count.
  const global = rawGlobal ? migrateToView(rawGlobal) : null;
  const user = rawUser ? migrateToView(rawUser) : null;
  const userApplied = user && !user.disabled ? user : null;
  const globalApplied = global && !global.disabled ? global : null;

  return {
    global,
    user,
    resolved:  userApplied || globalApplied,
    hasGlobal: !!rawGlobal,
    hasUser:   !!rawUser,
  };
}

// Fetch the templating ConfigMaps (marker-labeled only) into the management store cache. Shared by
// the Home page and the editors so we never pull every ConfigMap in the cluster.
export async function fetchTemplatingConfigMaps(store) {
  if (!store.getters['management/schemaFor'](CONFIGMAP)) {
    return [];
  }

  const url = `/v1/configmaps?labelSelector=${ encodeURIComponent(`${ LABEL_MARKER }=true`) }`;

  return store.dispatch('management/findAll', { type: CONFIGMAP, opt: { url, force: true } }).catch(() => []);
}

/** Create-or-update a CODE Home template ConfigMap (the SFC the editor and the AI agent write). */
export async function saveHomeTemplate(store, { name, source, displayName }) {
  const existing = cmById(store.getters, name);
  const data = { [SFC_KEY]: source || '', displayName: displayName || name };

  if (existing && labelOf(existing, LABEL_TYPE) === TYPE_HOME) {
    existing.data = { ...(existing.data || {}), ...data };
    await existing.save();

    return existing;
  }

  const cm = await store.dispatch('management/create', {
    type:     CONFIGMAP,
    metadata: {
      name, namespace: TEMPLATE_NAMESPACE, labels: homeLabels
    },
    data,
  });

  await cm.save();

  return cm;
}

/**
 * Persist the applied-Home map into the DEDICATED home ConfigMap (create it if missing). This CM
 * holds ONLY data.home — never the kill switch — so writing the Home can't affect data.enabled.
 */
async function persistHome(store, home) {
  const existing = cmById(store.getters, HOME_CONFIG_NAME);

  if (existing && labelOf(existing, LABEL_TYPE) === TYPE_CONFIG) {
    existing.data = { ...(existing.data || {}), home: JSON.stringify(home) };
    await existing.save();
  } else {
    const cm = await store.dispatch('management/create', {
      type:     CONFIGMAP,
      metadata: {
        name: HOME_CONFIG_NAME, namespace: TEMPLATE_NAMESPACE, labels: configLabels
      },
      data: { home: JSON.stringify(home) },
    });

    await cm.save();
  }
}

/** Persist a whole Home VIEW (panels + the widgets on them) for a scope. null clears the scope. */
export async function saveView(store, scope, view, userId) {
  const home = homeConfig(store.getters);

  if (scope === 'user') {
    if (!userId) {
      return;
    }
    if (view) {
      home.users = { ...(home.users || {}), [userId]: view };
    } else if (home.users) {
      delete home.users[userId];
    }
  } else if (view) {
    home.global = view;
  } else {
    delete home.global;
  }

  await persistHome(store, home);
}
