import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';
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
 * saved panel shows each cluster on its own dashboard. On the Home there is no page cluster, so such
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

/** What a cluster widget says when it has no cluster to show - which only happens off a cluster page. */
export const NO_CLUSTER = 'Choose a cluster in this widget’s settings — it follows the page’s cluster, and this page has none.';
