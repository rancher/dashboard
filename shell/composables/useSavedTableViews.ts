/**
 * The saved views of one resource type, as the user's preference holds them.
 *
 * One preference holds every type's views, keyed by type, along with which view the list opens on
 * and where the table's own tab sits among them. This is that preference seen from one type: read
 * it, write it, and name a new view without clashing with one already there.
 */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { TABLE_VIEWS } from '@shell/store/prefs';
import type { TableViewSaved } from '@shell/types/table-views';

/** @param resourceType the key the views are kept under, normally the resource type */
export function useSavedTableViews(resourceType: () => string) {
  const store = useStore();

  const allSavedViews = computed({
    get: () => store.getters['prefs/get'](TABLE_VIEWS),
    set: (value) => store.dispatch('prefs/set', { key: TABLE_VIEWS, value }),
  });

  /** This type's entry */
  const entry = computed(() => allSavedViews.value?.[resourceType()]);

  // An array is the shape the views were first kept in, before they had a default of their own
  const savedViews = computed<TableViewSaved[]>(() => (Array.isArray(entry.value) ? entry.value : entry.value?.views || []));

  /** The view applied when the list is first opened, if the user has set one */
  const defaultViewId = computed<string | null>(() => entry.value?.defaultViewId || null);

  /**
   * Where the table's own tab sits among the saved ones.
   *
   * It is not a saved view, so it has no place in that list to hold - but it can be dragged
   * about like any other tab, so its place has to be kept somewhere. Missing means the front,
   * which is where it was before it could be moved.
   */
  const allTabIndex = computed(() => {
    const at = entry.value?.allIndex;

    return Math.min(Math.max(Number.isInteger(at) ? at : 0, 0), savedViews.value.length);
  });

  const persistAll = (views: TableViewSaved[], viewId: string | null, allIndex: number = allTabIndex.value) => {
    // A view that no longer exists can't be the default one
    const validDefault = views.find((v) => v.id === viewId) ? viewId : null;

    allSavedViews.value = {
      ...(allSavedViews.value || {}),
      [resourceType()]: {
        views,
        defaultViewId: validDefault,
        allIndex:      Math.min(Math.max(allIndex, 0), views.length)
      }
    };
  };

  const persist = (views: TableViewSaved[]) => persistAll(views, defaultViewId.value);

  /**
   * `base`, or the first number after it that no view is called yet.
   *
   * `from` is where the counting starts: a new view is just "Untitled" until there is one, so
   * the second is "Untitled 1"; a copy is "X (copy)" and the next is "X (copy) 2", which reads
   * as the second copy rather than as a second thing called copy.
   */
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
