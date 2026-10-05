/** One resource type's saved views, from the preference that holds every type's */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { TABLE_VIEWS } from '@shell/store/prefs';
import { ALL_TAB_KEY } from '@shell/utils/table-views/global';
import { persistenceIdOf, savedViewsByType, savedViewsPref } from '@shell/utils/table-views/views';
import type { TableViewSaved } from '@shell/types/table-views';

interface SavedEntry {
  views: TableViewSaved[];
  /** A view's id, shared views' included, or `all` for the table's own tab over the page's shared default */
  defaultViewId?: string | null;
  allIndex?: number;
  /**
   * Every tab's key in the user's order, shared views' included. Only kept once there are shared
   * views; without them the views' order and `allIndex` say it all
   */
  order?: string[] | null;
}

interface TypeEntry extends SavedEntry {
  /** Pages keeping views of their own for the type, by page, eg `home` */
  pages?: Record<string, SavedEntry>;
}

/** Without the properties that say nothing: null and empty strings. 0, false and lists stay */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== '')) as T;
}

/**
 * `page` is set for a page keeping views of its own, which live under the type's entry. Unset, the
 * views are the type's own, shared by every other list of it. `shared` is the views shared with
 * everyone on the list, which the user's default and order can point at
 */
export function useSavedTableViews(
  resourceType: () => string,
  page: () => string | null = () => null,
  shared: () => TableViewSaved[] = () => []
) {
  const store = useStore();

  /** Every type's, by type; written with the version of its shape, keeping the persistence id */
  const allSavedViews = computed({
    get: () => savedViewsByType<TypeEntry | TableViewSaved[]>(store.getters['prefs/get'](TABLE_VIEWS)),
    set: (value) => store.dispatch('prefs/set', { key: TABLE_VIEWS, value: savedViewsPref(value, persistenceIdOf(store.getters['prefs/get'](TABLE_VIEWS))) }),
  });

  /** The first shape views were kept in, before a default was stored beside them, was the bare list */
  const typeEntry = computed<TypeEntry | undefined>(() => {
    const stored = allSavedViews.value?.[resourceType()];

    return Array.isArray(stored) ? { views: stored } : stored;
  });

  const entry = computed<SavedEntry | undefined>(() => (page() ? typeEntry.value?.pages?.[page() as string] : typeEntry.value));

  const savedViews = computed<TableViewSaved[]>(() => entry.value?.views || []);

  const defaultViewId = computed<string | null>(() => entry.value?.defaultViewId || null);

  /** Where the table's own tab sits among the saved ones; missing means the front */
  const allTabIndex = computed(() => {
    const at = entry.value?.allIndex;

    return Math.min(Math.max(Number.isInteger(at) ? at as number : 0, 0), savedViews.value.length);
  });

  /** The user's own tab order, shared views' included; null until there are shared views to place */
  const tabOrder = computed<string[] | null>(() => (entry.value?.order?.length ? entry.value.order : null));

  /**
   * @param order every tab's key in order; left out, the stored one stays, less any view dropped
   */
  const persistAll = (views: TableViewSaved[], viewId: string | null, allIndex: number = allTabIndex.value, order?: string[] | null) => {
    const ids = new Set(views.map((v) => v.id));
    const sharedIds = new Set(shared().map((v) => v.id));
    // A view gone to the shared ones keeps its place and default
    const dropped = new Set(savedViews.value.map((v) => v.id).filter((id) => !ids.has(id) && !sharedIds.has(id)));
    // A default on a shared view stays while those views are still loading, unless the view was the user's own
    const keptDefault = viewId === defaultViewId.value && !!viewId && !dropped.has(viewId);
    const validDefault = viewId && (ids.has(viewId) || sharedIds.has(viewId) || viewId === ALL_TAB_KEY || keptDefault) ? viewId : null;
    const nextOrder = (order === undefined ? tabOrder.value : order)?.filter((key) => !dropped.has(key)) || null;
    const saved: SavedEntry = compact({
      views:         views.map((view) => compact(view)),
      defaultViewId: validDefault,
      allIndex:      Math.min(Math.max(allIndex, 0), views.length),
      order:         nextOrder?.length ? nextOrder : null,
    });
    const current = typeEntry.value || { views: [] };
    // A page's views go beside the type's own, and saving either keeps the other
    const pages = { ...(current.pages || {}) };

    if (page()) {
      pages[page() as string] = saved;
    }

    const next: TypeEntry = { ...(page() ? current : saved) };

    // Nothing is kept for a type or a page left with nothing of the user's: no views, default or order
    const isEmpty = (kept: SavedEntry) => !kept.views?.length && !kept.defaultViewId && !kept.order?.some((key) => key !== ALL_TAB_KEY);

    Object.keys(pages).forEach((key) => {
      if (isEmpty(pages[key])) {
        delete pages[key];
      }
    });

    if (Object.keys(pages).length) {
      next.pages = pages;
    } else {
      delete next.pages;
    }

    const all = { ...(allSavedViews.value || {}) };

    if (!isEmpty(next) || next.pages) {
      all[resourceType()] = next;
    } else {
      delete all[resourceType()];
    }

    allSavedViews.value = all;
  };

  const persist = (views: TableViewSaved[]) => persistAll(views, defaultViewId.value);

  /** `from` is where numbering starts: "Untitled", then "Untitled 1"; "X (copy)", then "X (copy) 2" */
  const unusedViewName = (base: string, from: number) => {
    let name = base;
    let n = from;

    const taken = new Set(savedViews.value.concat(shared()).map((v) => v.name));

    while (taken.has(name)) {
      name = `${ base } ${ n++ }`;
    }

    return name;
  };

  return {
    savedViews, defaultViewId, allTabIndex, tabOrder, persistAll, persist, unusedViewName
  };
}
