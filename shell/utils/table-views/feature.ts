import { IMPROVED_TABLES } from '@shell/store/features';
import { getPackageFromRoute } from '@shell/utils/router';

export interface GetterSource {
  getters?: Record<string, unknown>;
  rootGetters?: Record<string, unknown>;
}

export function isImprovedTablesEnabled(store?: GetterSource | null): boolean {
  const get = (store?.rootGetters || store?.getters)?.['features/get'];

  // No store to ask, eg a resource with a partial context: use the flag's default, on
  if (typeof get !== 'function') {
    return true;
  }

  // An older Rancher running an extension built with this shell has no such flag, and its store throws
  // for a flag it doesn't know: no table views there
  try {
    return !!get(IMPROVED_TABLES);
  } catch {
    return false;
  }
}

/**
 * This copy of the module. An extension is built with its own copy of the shell, so a table built into
 * one finds a different object here from the one the dashboard provides under TABLE_VIEWS_SHELL_KEY
 */
export const TABLE_VIEWS_SHELL = Object.freeze({});

export const TABLE_VIEWS_SHELL_KEY = 'tableViewsShell';

interface ExtensionPlugin {
  name?: string;
  builtin?: boolean;
}

export interface ExtensionContext {
  /** What the dashboard provides under TABLE_VIEWS_SHELL_KEY; nothing where it provides nothing, eg a unit test */
  providedShell?: object | null;
  route?: Record<string, any> | null;
  extensions?: { getPlugins?: () => Record<string, ExtensionPlugin> } | null;
}

/**
 * Is the table an extension's: built into one, or on a page one added? Extensions keep the tables
 * they were written for unless they ask for table views. The built-in ones ship with the dashboard,
 * so they count as its own.
 *
 * Not by product: an extension that adds pages to a product of the dashboard's lists it among its
 * own, which would take the table views off the dashboard's pages there too
 */
export function isExtensionTable({ providedShell, route, extensions }: ExtensionContext): boolean {
  if (providedShell && providedShell !== TABLE_VIEWS_SHELL) {
    return true;
  }

  const pkg = route ? getPackageFromRoute(route) : undefined;

  if (!pkg) {
    return false;
  }

  return Object.values(extensions?.getPlugins?.() || {}).some((plugin) => plugin.name === pkg && !plugin.builtin);
}
