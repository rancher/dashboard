/**
 * A list's views shared with everyone, held by TableConfiguration resources on the upstream
 * cluster. Without the resource type, or the right to see it, there are none and nothing changes
 */
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { UI } from '@shell/config/types';
import { globalPageKey, globalViewsFor, viewConfigName } from '@shell/utils/table-views/global';
import type { GlobalTableView, TableConfiguration } from '@shell/utils/table-views/global';
import type { TableViewSaved } from '@shell/types/table-views';

const TYPE = UI.TABLE_CONFIGURATION;

/** Stored without the properties that say nothing, as the user's own views are */
function compactView(view: TableViewSaved): TableViewSaved {
  return Object.fromEntries(Object.entries(view).filter(([, v]) => v !== null && v !== '' && v !== undefined)) as TableViewSaved;
}

interface SavableConfig extends TableConfiguration {
  save: () => Promise<unknown>;
  remove: () => Promise<unknown>;
}

export function useGlobalTableViews(resourceType: () => string, page: () => string | null = () => null) {
  const store = useStore();

  // A host without the upstream store, eg a standalone product, has no shared views
  const schema = computed(() => store.getters['management/schemaFor']?.(TYPE));

  const configs = computed<TableConfiguration[]>(() => (schema.value && store.getters['management/haveAll'](TYPE) ? store.getters['management/all'](TYPE) : []));

  const pageKey = computed(() => globalPageKey(resourceType(), page()));

  const globalViews = computed(() => globalViewsFor(configs.value, pageKey.value));

  const sharedViews = computed<TableViewSaved[]>(() => globalViews.value.views.map((entry) => entry.view));

  /** Whether the user can share a view: create the resources, which is an administrator's to do */
  const canShare = computed(() => !!schema.value?.collectionMethods?.some((method: string) => method.toUpperCase() === 'POST'));

  const entryFor = (id?: string | null): GlobalTableView | undefined => globalViews.value.views.find((entry) => entry.view.id === id);

  const isShared = (id?: string | null) => !!entryFor(id);

  const canEdit = (id?: string | null) => !!entryFor(id)?.config.canUpdate;

  /** A PAGE resource's view is taken out of its list, so that is an edit of the resource */
  const canRemove = (id?: string | null) => {
    const config = entryFor(id)?.config;

    return !!(config?.spec?.type === 'PAGE' ? config.canUpdate : config?.canDelete);
  };

  const failed = (err: unknown) => {
    store.dispatch('growl/fromError', { err });
  };

  const load = async() => {
    if (!schema.value) {
      return;
    }

    try {
      await store.dispatch('management/findAll', { type: TYPE });
    } catch {
      // Shared views add to a list; one that can't have them still works
    }
  };

  /** Shares a view as it is, under its id, so the user's order and default keep pointing at it */
  const share = async(view: TableViewSaved): Promise<boolean> => {
    try {
      const config = await store.dispatch('management/create', {
        type:     TYPE,
        metadata: { name: viewConfigName(pageKey.value, view.id) },
        spec:     {
          type: 'VIEW', page: pageKey.value, view: compactView(view)
        },
      });

      await config.save();

      return true;
    } catch (err) {
      failed(err);

      return false;
    }
  };

  /** Saves changes to a shared view, in its own resource or in its page's list */
  const update = async(id: string, changes: Partial<TableViewSaved>): Promise<boolean> => {
    const entry = entryFor(id);

    if (!entry) {
      return false;
    }

    try {
      const copy: SavableConfig = await store.dispatch('management/clone', { resource: entry.config });
      const spec = copy.spec as NonNullable<TableConfiguration['spec']>;

      if (spec.type === 'PAGE') {
        spec.views = (spec.views || []).map((view) => (view.id === id ? compactView({ ...view, ...changes }) : view));
      } else {
        spec.view = compactView({ ...(spec.view as TableViewSaved), ...changes });
      }

      await copy.save();

      return true;
    } catch (err) {
      failed(err);

      return false;
    }
  };

  /** Takes a shared view away from everyone: its resource goes, or its entry in its page's list */
  const remove = async(id: string): Promise<boolean> => {
    const entry = entryFor(id);

    if (!entry) {
      return false;
    }

    try {
      if (entry.config.spec?.type !== 'PAGE') {
        await (entry.config as SavableConfig).remove();

        return true;
      }

      const copy: SavableConfig = await store.dispatch('management/clone', { resource: entry.config });
      const spec = copy.spec as NonNullable<TableConfiguration['spec']>;
      const at = (spec.views || []).findIndex((view) => view.id === id);

      spec.views = (spec.views || []).filter((view) => view.id !== id);

      if (spec.defaultViewId === id) {
        delete spec.defaultViewId;
      }

      // The table's own tab keeps its place among what is left
      if (Number.isInteger(spec.allIndex) && at >= 0 && at < (spec.allIndex as number)) {
        spec.allIndex = (spec.allIndex as number) - 1;
      }

      await copy.save();

      return true;
    } catch (err) {
      failed(err);

      return false;
    }
  };

  onMounted(load);

  return {
    globalViews, sharedViews, canShare, isShared, canEdit, canRemove, share, update, remove, load
  };
}
