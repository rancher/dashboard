import {
  getCurrentInstance, reactive, type Component, type ComponentOptionsMixin, type CSSProperties
} from 'vue';
import { useStore, type Store } from 'vuex';
import { useRoute, useRouter, type Router } from 'vue-router';
import { ExtensionPoint, CardLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { pageClusterOf } from './useWidgetCluster';
import { fetchMonitoring } from '../templating/widget-data';
import { WIDGET_ALERTS, WIDGET_METRICS, WIDGET_EXTENSION_CARDS, WIDGET_TABS } from '../templating/widget-catalog';
import type { WidgetSpec } from '../templating/types';

// Whether a widget has anything to show where it is.
//
// The cluster dashboard leaves parts out when a cluster does not have them: no Alerts or metrics tabs
// without Rancher's monitoring, no extension-card row when no extension adds one. A view rebuilt from
// widgets has to do the same to look like the dashboard, so outside the editor such a widget is not
// drawn at all - and a tab holding nothing but those is left out, and a Tabs widget whose tabs all
// are. While editing, everything is drawn, and the widget says what it is missing.
//
// Only the widgets that depend on something a cluster may lack are ever absent; a widget that asks
// for a cluster is present, so it can ask.

/** A card as the extension manager hands it back, with the label already translated. */
export interface ExtensionCard {
  label?: string;
  component: Component;
  style?: CSSProperties;
}

/**
 * The cards extensions add to the dashboard of `cluster`: the ones that apply to that dashboard's
 * route, as the dashboard asks. `self` is a component - the extension manager reads `$extension` and
 * `t` off it.
 */
export function extensionCardsFor(self: ComponentOptionsMixin | undefined, router: Router, cluster: string): ExtensionCard[] {
  if (!self || !cluster) {
    return [];
  }

  const route = router.resolve({ name: 'c-cluster-explorer', params: { cluster } });

  return getApplicableExtensionEnhancements<ExtensionCard>(self, ExtensionPoint.CARD, CardLocation.CLUSTER_DASHBOARD_CARD, route);
}

// Which clusters have Rancher's monitoring, shared by every widget: asked once per cluster, and again
// after a minute, as a visit to the dashboard would. Unknown until the answer comes back.
const MONITORING_TTL_MS = 60000;
const monitoring = reactive<Record<string, { installed: boolean; at: number }>>({});
const asking = new Set<string>();

function hasMonitoring(store: Store<unknown>, cluster: string): boolean | undefined {
  const known = monitoring[cluster];

  if ((!known || Date.now() - known.at > MONITORING_TTL_MS) && !asking.has(cluster)) {
    asking.add(cluster);
    fetchMonitoring(store, cluster)
      .then(({ installed }) => {
        monitoring[cluster] = { installed, at: Date.now() };
      })
      .finally(() => asking.delete(cluster));
  }

  return known?.installed;
}

export function useWidgetPresence() {
  const store = useStore();
  const route = useRoute();
  const router = useRouter();
  const self = getCurrentInstance()?.proxy as unknown as ComponentOptionsMixin | undefined;

  /** Whether a widget has anything to show here. Not yet known counts as not - the dashboard waits too. */
  function present(spec: WidgetSpec): boolean {
    const cluster = spec.cluster || pageClusterOf(route);

    if (spec.kind === WIDGET_TABS) {
      return (spec.tabs || []).some((tab) => tabPresent(tab.widgets.map((w) => w.widget)));
    }

    if (!cluster) {
      return true;
    }

    switch (spec.kind) {
    case WIDGET_ALERTS:
    case WIDGET_METRICS:
      return hasMonitoring(store, cluster) === true;
    case WIDGET_EXTENSION_CARDS:
      return extensionCardsFor(self, router, cluster).length > 0;
    default:
      return true;
    }
  }

  /** A tab is left out when everything in it is. An empty tab stays: someone made it, to fill. */
  function tabPresent(widgets: WidgetSpec[]): boolean {
    return !widgets.length || widgets.some(present);
  }

  return { present, tabPresent };
}
