// Where the configurable pages are STORED: two labeled ConfigMaps in the local cluster's `default`
// namespace, read and written through the management store (Steve `/v1/`).
//
//   templating-home    one key per PAGE, each holding every saved view of that page:
//                        data.home              the Home
//                        data.clusterDashboard  the cluster dashboard - one set of views for every
//                                               cluster, whose widgets follow the cluster they are on
//                      each shaped { global: <View>, users: { <uid>: <View> } }
//   templating-config  data.enabled — the kill switch; 'false' turns the feature off, everywhere
//
// Two ConfigMaps rather than one so that writing the Home can never flip the switch. ConfigMaps in
// `default` are a prototype's storage: per-user state belongs in a user preference and the published
// view in a Setting, which is an open question on the pull request.

import type { Store } from 'vuex';
import { migrateViewSet } from './view-model';
import type { ViewSet } from './types';

type Getters = Store<unknown>['getters'];

const CONFIGMAP = 'configmap';
const NAMESPACE = 'default';

// Every stored ConfigMap carries the marker; the type label tells them apart.
// The marker keeps its old name on purpose. It is ON the stored ConfigMaps - every saved view and
// the kill switch - so renaming it orphans all of them.
const LABEL_MARKER = 'templates.rancher.io/ai-templating';
const LABEL_TYPE = 'templates.rancher.io/type';
const TYPE_CONFIG = 'config';

const CONFIG_NAME = 'templating-config';
const HOME_CONFIG_NAME = 'templating-home';

const configLabels = { [LABEL_MARKER]: 'true', [LABEL_TYPE]: TYPE_CONFIG };

/** A page that can be configured, and the key its views are stored under in templating-home. */
export type PageKey = 'home' | 'clusterDashboard';

// This package's product, its pages, and the routes the Product API makes for them - kept here so
// product.ts and routing/index.ts agree. The name has no dashes: the API takes them out of a
// product's name, so its routes do not read as nested route names.
export const PRODUCT_NAME = 'configurableviews';
export const PAGE_SETTINGS = 'settings';
export const PAGE_VIEWS = 'views';
export const ROUTE_SETTINGS = `${ PRODUCT_NAME }-c-cluster-${ PAGE_SETTINGS }`;
export const ROUTE_VIEWS = `${ PRODUCT_NAME }-c-cluster-${ PAGE_VIEWS }`;

/** A ConfigMap as the management store hands it back: its fields, and `save`. */
interface ConfigMapModel {
  metadata: { name: string; labels?: Record<string, string> };
  data?: Record<string, string>;
  save(): Promise<unknown>;
}

/** What one page's key of `templating-home` holds, parsed. Views stay `unknown` until migrateViewSet has checked them. */
export interface PageConfig {
  global?: unknown;
  users?: Record<string, unknown>;
}

/** The saved views as one user sees them. */
export interface ViewScopes {
  /** The organization's view, as stored (disabled or not) - what an editor edits. */
  global: ViewSet | null;
  /** This user's own view, as stored. */
  user: ViewSet | null;
  /** What actually renders: the user's if enabled, else the organization's if enabled, else none. */
  resolved: ViewSet | null;
  hasGlobal: boolean;
  hasUser: boolean;
}

// ---- reading ----------------------------------------------------------------------------------------

function parse(json: string | undefined): PageConfig {
  if (!json) {
    return {};
  }
  try {
    const out = JSON.parse(json);

    return out && typeof out === 'object' ? out : {};
  } catch (e) {
    return {};
  }
}

function cmNamed(getters: Getters, name: string): ConfigMapModel | undefined {
  return getters['management/byId']?.(CONFIGMAP, `${ NAMESPACE }/${ name }`) ||
    (getters['management/all']?.(CONFIGMAP) || []).find((cm: ConfigMapModel) => cm.metadata?.name === name && cm.metadata?.labels?.[LABEL_MARKER] === 'true');
}

/**
 * Load this package's ConfigMaps into the management store - and only those.
 *
 * Through the shell's label-selector read, which filters on the SERVER. The query this replaced put
 * `?labelSelector=` on `/v1/configmaps`, which Steve ignores: it returned every ConfigMap in the
 * cluster, 349 of them and 7 MB on the development server, on every visit to the Home, to find 7.
 *
 * Never rejects: a failed read leaves the store as it was, and the Home shows what it last had.
 */
export async function fetchTemplatingConfigMaps(store: Store<unknown>): Promise<void> {
  if (!store.getters['management/schemaFor'](CONFIGMAP)) {
    return;
  }

  await store.dispatch('management/findLabelSelector', {
    type:     CONFIGMAP,
    matching: { namespace: NAMESPACE, labelSelector: { matchLabels: { [LABEL_MARKER]: 'true' } } },
    opt:      { force: true },
  }).catch(() => undefined);
}

function pageConfig(getters: Getters, page: PageKey): PageConfig {
  const stored = cmNamed(getters, HOME_CONFIG_NAME)?.data?.[page];

  if (stored !== undefined) {
    return parse(stored);
  }

  // The Home used to live in the kill-switch ConfigMap. Still read there until the next save moves it.
  return page === 'home' ? parse(cmNamed(getters, CONFIG_NAME)?.data?.home) : {};
}

/** A page's raw stored config ({ global, users }) - for the Configurable Views page's YAML editor. */
export function getPageConfig(getters: Getters, page: PageKey = 'home'): PageConfig {
  return pageConfig(getters, page);
}

/**
 * The saved views split by scope, and the one THIS user sees: their own overrides the
 * organization's, and a disabled view is skipped so the scope beneath it shows. Old stored shapes
 * are migrated on read (see migrateViewSet).
 */
export function appliedViewScopes(getters: Getters, userId?: string | null, page: PageKey = 'home'): ViewScopes {
  const home = pageConfig(getters, page);
  const rawGlobal = home.global || null;
  const rawUser = (userId && home.users?.[userId]) || null;

  const global = rawGlobal ? migrateViewSet(rawGlobal) : null;
  const user = rawUser ? migrateViewSet(rawUser) : null;
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

// ---- the kill switch --------------------------------------------------------------------------------

/** data.enabled === 'false' turns the feature off. Absent, or anything else, means on. */
export function isTemplatingEnabled(getters: Getters): boolean {
  return cmNamed(getters, CONFIG_NAME)?.data?.enabled !== 'false';
}

/** The URL's own switch: `?confviews=false`. */
export const VIEWS_QUERY = 'confviews';

/**
 * Whether the URL turns the configurable pages off: `?confviews=false` shows Rancher's own page, as
 * the kill switch does, but only for as long as it is in the URL - nothing is stored, and the switch
 * itself is not touched.
 */
export function viewsOffInUrl(query: Record<string, unknown> | null | undefined): boolean {
  const value = query?.[VIEWS_QUERY];

  return (Array.isArray(value) ? value[0] : value) === 'false';
}

/** Set the kill switch - or flip it, with no argument. Resolves to the new state. */
export async function toggleTemplating(store: Store<unknown>, enabled?: boolean): Promise<boolean> {
  const desired = typeof enabled === 'boolean' ? enabled : !isTemplatingEnabled(store.getters);
  const existing = cmNamed(store.getters, CONFIG_NAME);

  if (existing) {
    existing.data = { ...(existing.data || {}), enabled: desired ? 'true' : 'false' };
    await existing.save();
  } else {
    const cm: ConfigMapModel = await store.dispatch('management/create', {
      type:     CONFIGMAP,
      metadata: {
        name: CONFIG_NAME, namespace: NAMESPACE, labels: configLabels
      },
      data: { enabled: desired ? 'true' : 'false' },
    });

    await cm.save();
  }

  return desired;
}

// ---- writing ------------------------------------------------------------------------------------------

/**
 * Write one page's whole stored config to `templating-home`, creating it if needed. Each page is its
 * own key, and the other pages' keys are written back as they were; nothing here touches the kill
 * switch, which is a different ConfigMap.
 */
async function persistPage(store: Store<unknown>, page: PageKey, config: PageConfig): Promise<void> {
  const existing = cmNamed(store.getters, HOME_CONFIG_NAME);

  if (existing && existing.metadata.labels?.[LABEL_TYPE] === TYPE_CONFIG) {
    existing.data = { ...(existing.data || {}), [page]: JSON.stringify(config) };
    await existing.save();
  } else {
    const cm: ConfigMapModel = await store.dispatch('management/create', {
      type:     CONFIGMAP,
      metadata: {
        name: HOME_CONFIG_NAME, namespace: NAMESPACE, labels: configLabels
      },
      data: { [page]: JSON.stringify(config) },
    });

    await cm.save();
  }
}

/** Write a page's raw stored config - from the Configurable Views page's YAML editor. */
export async function savePageConfig(store: Store<unknown>, config: PageConfig | null, page: PageKey = 'home'): Promise<void> {
  await persistPage(store, page, config || {});
}

/** Save one scope's view of a page. `null` clears that scope. */
export async function saveView(store: Store<unknown>, scope: 'global' | 'user', view: ViewSet | null, userId?: string | null, page: PageKey = 'home'): Promise<void> {
  const home = pageConfig(store.getters, page);

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

  await persistPage(store, page, home);
}
