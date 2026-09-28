import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';
import { useStore } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

/**
 * The cluster the PAGE is about, or '' when it is about none.
 *
 * A cluster page carries its cluster in the route (`/c/<id>/...`); the Home and the global products
 * carry the blank cluster `_`, which is not a cluster.
 */
export function pageClusterOf(route?: Pick<RouteLocationNormalizedLoaded, 'params'>): string {
  const id = route?.params?.cluster;

  return typeof id === 'string' && id && id !== BLANK_CLUSTER ? id : '';
}

/**
 * Which cluster a widget shows: its own, else the page's.
 *
 * A widget that names a cluster shows that cluster wherever it is placed. One that names none FOLLOWS
 * THE PAGE - on a cluster's dashboard it shows that cluster, with nothing to set up, and the same
 * saved view shows each cluster on its own dashboard. On the Home there is no page cluster, so such
 * a widget asks for one instead of guessing.
 *
 * `cluster` is '' in exactly that last case, and every cluster widget treats '' as "ask".
 */
export function useWidgetCluster(widget: MaybeRefOrGetter<{ cluster?: string }>) {
  const route = useRoute();
  const pageCluster = computed(() => pageClusterOf(route));
  const cluster = computed(() => toValue(widget)?.cluster || pageCluster.value);

  return { cluster, pageCluster };
}

/**
 * Whether `cluster` is the one Rancher has OPEN - loaded into the `cluster` store, which is the only
 * cluster the dashboard's own components can read.
 *
 * When it is, a widget can render that component as it is, and look and behave exactly like the
 * dashboard; when it is not, the widget has to read the cluster itself.
 */
export function useOpenCluster(cluster: MaybeRefOrGetter<string>) {
  const store = useStore();

  return computed(() => {
    const id = toValue(cluster);

    return !!id && !!store.getters['clusterReady'] && store.getters['clusterId'] === id;
  });
}

/** What a cluster widget says when it has no cluster to show - which only happens off a cluster page. */
export const NO_CLUSTER = 'Choose a cluster in this widget’s settings — it follows the page’s cluster, and this page has none.';
