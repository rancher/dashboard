/**
 * Views shared with everyone: TableConfiguration resources on the upstream cluster. A user's own
 * views stay in their preferences; these are read by everyone and written by those allowed to
 */
import type { TableViewSaved } from '@shell/types/table-views';

/** The key the table's own tab has in a tab order */
export const ALL_TAB_KEY = 'all';

export interface TableConfigurationSpec {
  /** PAGE: a page's views, default and tab place, one per page. VIEW: one view adding to a page */
  type: 'PAGE' | 'VIEW';
  /** A resource type, eg `pod`, or a page keeping views of its own, eg `home` */
  page: string;
  view?: TableViewSaved;
  views?: TableViewSaved[];
  defaultViewId?: string | null;
  allIndex?: number;
}

export interface TableConfiguration {
  id?: string;
  metadata?: { name?: string; creationTimestamp?: string };
  spec?: TableConfigurationSpec;
  canUpdate?: boolean;
  canDelete?: boolean;
}

/** A shared view, with the resource holding it */
export interface GlobalTableView {
  view: TableViewSaved;
  config: TableConfiguration;
}

export interface GlobalTableViews {
  views: GlobalTableView[];
  /** The page's default, from its PAGE resource */
  defaultViewId: string | null;
  /** Where the table's own tab sits among the PAGE resource's views */
  allIndex: number;
}

/** What a list's shared views are filed under: its page when it keeps views of its own, else its type */
export function globalPageKey(resourceType: string, page?: string | null): string {
  return page || resourceType;
}

const createdOf = (config: TableConfiguration) => config.metadata?.creationTimestamp || '';

const nameOf = (config: TableConfiguration) => config.metadata?.name || '';

/** Oldest first, so a new one joins the end; the name settles a tie */
const byAge = (a: TableConfiguration, b: TableConfiguration) => createdOf(a).localeCompare(createdOf(b)) || nameOf(a).localeCompare(nameOf(b));

/**
 * A page's shared views: its PAGE resource's, in their order, then each VIEW resource's. Only one
 * PAGE resource counts, the oldest; a view id seen twice keeps its first
 */
export function globalViewsFor(configs: TableConfiguration[] | null | undefined, pageKey: string): GlobalTableViews {
  const forPage = (configs || []).filter((config) => config?.spec?.page === pageKey);
  const pageConfig = forPage.filter((config) => config.spec?.type === 'PAGE').sort(byAge)[0];
  const viewConfigs = forPage.filter((config) => config.spec?.type === 'VIEW' && config.spec.view?.id).sort(byAge);

  const views: GlobalTableView[] = [];
  const seen = new Set<string>();
  const add = (view: TableViewSaved | undefined, config: TableConfiguration) => {
    if (!view?.id || !view.name || seen.has(view.id)) {
      return;
    }

    seen.add(view.id);
    views.push({ view, config });
  };

  (pageConfig?.spec?.views || []).forEach((view) => add(view, pageConfig));

  const pageViewCount = views.length;

  viewConfigs.forEach((config) => add(config.spec?.view, config));

  const defaultViewId = pageConfig?.spec?.defaultViewId;
  const allIndex = pageConfig?.spec?.allIndex;

  return {
    views,
    defaultViewId: defaultViewId && seen.has(defaultViewId) ? defaultViewId : null,
    allIndex:      Math.min(Math.max(Number.isInteger(allIndex) ? allIndex as number : 0, 0), pageViewCount),
  };
}

/**
 * The order of a list's tabs, as keys: the views' ids, and `all` for the table's own tab.
 *
 * With an order of the user's own, that order, with views it doesn't know yet at the end. Without
 * one, the user's views in their order, with the shared views around the table's own tab
 */
export function tabOrderFor({
  personal, personalAllIndex = 0, global, order
}: {
  personal: TableViewSaved[];
  personalAllIndex?: number;
  global: GlobalTableViews;
  order?: string[] | null;
}): string[] {
  const globalIds = global.views.map((entry) => entry.view.id);
  const sharedIds = new Set(globalIds);
  // A view shared with everyone shows once, as shared
  const personalIds = personal.map((view) => view.id).filter((id) => !sharedIds.has(id));

  if (order?.length) {
    const known = new Set([ALL_TAB_KEY, ...personalIds, ...globalIds]);
    const out: string[] = [];

    order.forEach((key) => {
      if (known.has(key) && !out.includes(key)) {
        out.push(key);
      }
    });

    if (!out.includes(ALL_TAB_KEY)) {
      out.unshift(ALL_TAB_KEY);
    }

    globalIds.concat(personalIds).forEach((id) => {
      if (!out.includes(id)) {
        out.push(id);
      }
    });

    return out;
  }

  const shared = [...globalIds];

  shared.splice(global.allIndex, 0, ALL_TAB_KEY);

  const own = [...personalIds];

  own.splice(Math.min(Math.max(personalAllIndex, 0), own.length), 0, ALL_TAB_KEY);

  return own.flatMap((key) => (key === ALL_TAB_KEY ? shared : [key]));
}

/**
 * A new tab order that keeps the keys an older one had and it doesn't, each after the key it
 * followed: shared views not loaded when the user reordered keep their places
 */
export function mergeTabOrder(next: string[], previous?: string[] | null): string[] {
  if (!previous?.length) {
    return next;
  }

  const out = [...next];

  previous.forEach((key, i) => {
    if (out.includes(key)) {
      return;
    }

    const before = previous.slice(0, i).reverse().find((candidate) => out.includes(candidate));

    out.splice(before ? out.indexOf(before) + 1 : 0, 0, key);
  });

  return out;
}

/**
 * The view a list opens on, or null for the table's own tab. The user's choice wins, `all` being
 * theirs for the table's own tab; without one, the page's shared default
 */
export function defaultViewIdFor(personalDefault: string | null | undefined, global: GlobalTableViews, ids: string[]): string | null {
  if (personalDefault === ALL_TAB_KEY) {
    return null;
  }

  if (personalDefault && ids.includes(personalDefault)) {
    return personalDefault;
  }

  return global.defaultViewId && ids.includes(global.defaultViewId) ? global.defaultViewId : null;
}

/** A resource name for a VIEW resource: lower case letters, digits and dashes, kept short */
export function viewConfigName(pageKey: string, id: string): string {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return `view-${ clean(pageKey).slice(0, 180) }-${ clean(id).slice(0, 60) }`.replace(/-+$/, '');
}
