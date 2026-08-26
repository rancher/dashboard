import {
  computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref
} from 'vue';
import { useStore } from 'vuex';
import type { Store } from 'vuex';
import { SCHEMA } from '@shell/config/types';

/** Schema id to the short names Kubernetes accepts for it, e.g. `pod` -> `['po']`. */
export type ShortNameMap = Record<string, string[]>;

const cache: Record<string, ShortNameMap> = {};
const inFlight: Record<string, Promise<ShortNameMap>> = {};

function indexSchemasByResource(store: Store<any>): Record<string, string> {
  const byResource: Record<string, string> = {};

  for (const schema of (store.getters['cluster/all'](SCHEMA) || [])) {
    const resource = schema.attributes?.resource;

    if (resource) {
      byResource[`${ schema.attributes.group || '' }/${ resource }`] = schema.id;
    }
  }

  return byResource;
}

async function fetchShortNames(store: Store<any>, clusterId: string): Promise<ShortNameMap> {
  const base = `/k8s/clusters/${ encodeURIComponent(clusterId) }`;
  const byResource = indexSchemasByResource(store);

  const discover = (url: string) => store.dispatch('cluster/request', { url, redirectUnauthorized: false })
    .then((d: any) => d, () => null);

  const groupList = await discover(`${ base }/apis`);

  const known = new Set(Object.keys(byResource).map((key) => key.split('/')[0]));
  const groupVersions = (groupList?.groups || [])
    .map((group: any) => group.preferredVersion?.groupVersion)
    .filter((groupVersion: string) => groupVersion && known.has(groupVersion.split('/')[0]));

  const documents = await Promise.all([
    discover(`${ base }/api/v1`).then((d: any) => ({ group: '', d })),
    ...groupVersions.map((groupVersion: string) => discover(`${ base }/apis/${ groupVersion }`)
      .then((d: any) => ({ group: groupVersion.split('/')[0], d }))),
  ]);

  const shortNames: ShortNameMap = {};

  for (const { group, d } of documents) {
    for (const resource of (d?.resources || [])) {
      if (resource.name?.includes('/') || !resource.shortNames?.length) {
        continue;
      }

      const id = byResource[`${ group }/${ resource.name }`];

      if (id) {
        shortNames[id] = resource.shortNames.map((name: string) => name.toLowerCase());
      }
    }
  }

  return shortNames;
}

/**
 * The Kubernetes short names (`cm`, `po`, `deploy`) for the current cluster's
 * resource types, so they can be searched for alongside type names.
 *
 * The fetch is started in the background and never awaited: the returned map is
 * empty until it lands and then fills in, so a caller that reads it reactively
 * gets short names once they arrive and is never blocked waiting for them. A
 * cluster whose discovery cannot be read simply keeps an empty map.
 *
 * @param clusterId - Cluster to read discovery from. Accepts a ref or getter so
 *                    the map follows the active cluster. Defaults to the
 *                    currently active cluster from the store.
 * @returns A reactive map of schema id to short names.
 */
export function useResourceShortNames(clusterId?: MaybeRefOrGetter<string>): Ref<ShortNameMap> {
  const store = useStore();
  const shortNames = ref<ShortNameMap>({});

  const activeClusterId = computed(() => {
    const id = clusterId === undefined ? store.getters.clusterId : toValue(clusterId);

    return id || '';
  });

  watch(activeClusterId, (id) => {
    if (!id) {
      shortNames.value = {};

      return;
    }

    if (cache[id]) {
      shortNames.value = cache[id];

      return;
    }

    shortNames.value = {};

    inFlight[id] = inFlight[id] || fetchShortNames(store, id)
      .then((result) => {
        cache[id] = result;

        return result;
      })
      .catch(() => ({}))
      .finally(() => {
        delete inFlight[id];
      });

    inFlight[id].then((result) => {
      if (activeClusterId.value === id) {
        shortNames.value = result;
      }
    });
  }, { immediate: true });

  return shortNames;
}
