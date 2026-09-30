/** One resource type's saved views, from the preference that holds every type's */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { TABLE_VIEWS } from '@shell/store/prefs';
import type { TableViewSaved } from '@shell/types/table-views';

interface SavedEntry {
  views: TableViewSaved[];
  defaultViewId?: string | null;
  allIndex?: number;
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
 * views are the type's own, shared by every other list of it
 */
export function useSavedTableViews(resourceType: () => string, page: () => string | null = () => null) {
  const store = useStore();

  const allSavedViews = computed({
    get: () => store.getters['prefs/get'](TABLE_VIEWS),
    set: (value) => store.dispatch('prefs/set', { key: TABLE_VIEWS, value }),
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

  const persistAll = (views: TableViewSaved[], viewId: string | null, allIndex: number = allTabIndex.value) => {
    const validDefault = views.find((v) => v.id === viewId) ? viewId : null;
    const saved: SavedEntry = compact({
      views:         views.map((view) => compact(view)),
      defaultViewId: validDefault,
      allIndex:      Math.min(Math.max(allIndex, 0), views.length)
    });
    const current = typeEntry.value || { views: [] };
    // A page's views go beside the type's own, and saving either keeps the other
    const pages = { ...(current.pages || {}) };

    if (page()) {
      pages[page() as string] = saved;
    }

    const next: TypeEntry = { ...(page() ? current : saved) };

    // Nothing is kept for a type or a page left with no views: no default or tab place without them
    Object.keys(pages).forEach((key) => {
      if (!pages[key].views.length) {
        delete pages[key];
      }
    });

    if (Object.keys(pages).length) {
      next.pages = pages;
    } else {
      delete next.pages;
    }

    const all = { ...(allSavedViews.value || {}) };

    if (next.views.length || next.pages) {
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

    while (savedViews.value.find((v) => v.name === name)) {
      name = `${ base } ${ n++ }`;
    }

    return name;
  };

  return {
    savedViews, defaultViewId, allTabIndex, persistAll, persist, unusedViewName
  };
}
