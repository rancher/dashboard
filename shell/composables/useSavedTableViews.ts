/** One resource type's saved views, from the preference that holds every type's */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { TABLE_VIEWS } from '@shell/store/prefs';
import type { TableViewSaved } from '@shell/types/table-views';

export function useSavedTableViews(resourceType: () => string) {
  const store = useStore();

  const allSavedViews = computed({
    get: () => store.getters['prefs/get'](TABLE_VIEWS),
    set: (value) => store.dispatch('prefs/set', { key: TABLE_VIEWS, value }),
  });

  const entry = computed(() => allSavedViews.value?.[resourceType()]);

  // The first shape views were kept in, before a default was stored beside them
  const savedViews = computed<TableViewSaved[]>(() => (Array.isArray(entry.value) ? entry.value : entry.value?.views || []));

  const defaultViewId = computed<string | null>(() => entry.value?.defaultViewId || null);

  /** Where the table's own tab sits among the saved ones; missing means the front */
  const allTabIndex = computed(() => {
    const at = entry.value?.allIndex;

    return Math.min(Math.max(Number.isInteger(at) ? at : 0, 0), savedViews.value.length);
  });

  const persistAll = (views: TableViewSaved[], viewId: string | null, allIndex: number = allTabIndex.value) => {
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
