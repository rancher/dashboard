<script setup lang="ts">
import {
  computed, onBeforeUnmount, onErrorCaptured, ref, shallowRef, watch, type Component
} from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import SortableTable from '@shell/components/SortableTable/index.vue';
import PercentageBar from '@shell/components/PercentageBar.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import CountGauge from '@shell/components/CountGauge.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import SimpleBox from '@shell/components/SimpleBox.vue';
import LabelValue from '@shell/components/LabelValue.vue';
import Tag from '@shell/components/Tag.vue';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { generatedWidgets, widgetApprovals } from '../../templating/template-engine';
import { fetchClusterCounts, fetchStateSummaries } from '../../templating/widget-data';
import { countsFromSummaries } from '../../templating/status-cards';
import { widgetHash } from '../../templating/widget-hash';
import type { CompiledWidget } from '../../templating/widget-compiler';
import type { GeneratedComponentName } from '../../templating/widget-review';
import type { WidgetSpec } from '../../templating/types';

// A WIDGET LIZ WROTE — a Vue component from a ConfigMap of its own (see generatedWidgets), compiled in
// the page and drawn like any other widget.
//
// Only once an admin approved it, and only the exact code approved: the source's hash must match the
// approval, so a widget changed since - by Liz or by hand - shows that it needs approving again
// instead of running.
//
// The component gets what it may use handed to it: the cluster it shows, a read-only `api` for that
// cluster's data, and a few of Rancher's components to draw it with. It imports nothing but `vue`.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

/**
 * The components a generated widget can draw with, by the names it uses in its template - Rancher's
 * own, so what Liz writes looks and behaves like the rest of the dashboard. Keyed by the review's list
 * (see widget-review), so the two cannot drift apart. The Widget Builder agent is told to use these
 * for anything they cover, and the approval page says when a widget built something by hand instead.
 */
const COMPONENTS: Record<GeneratedComponentName, Component> = {
  Loading,
  SubtleLink,
  Card,
  SimpleBox,
  Banner,
  BadgeState,
  Tag,
  RcCounterBadge,
  LabelValue,
  SortableTable,
  StatusSummaryCard,
  StatusBreakdownCard,
  StatusBar,
  PercentageBar,
  ConsumptionGauge,
  CountGauge,
};

const source = computed(() => generatedWidgets(store.getters).find((w) => w.name === props.widget.component) || null);
const approved = computed(() => (props.widget.component ? widgetApprovals(store.getters)[props.widget.component] || '' : ''));

type State = 'missing' | 'pending' | 'changed' | 'loading' | 'ready' | 'failed';

const state = ref<State>('loading');
const error = ref('');
const compiled = shallowRef<Component | null>(null);
let styles: HTMLStyleElement[] = [];

function dropStyles(): void {
  styles.forEach((el) => el.remove());
  styles = [];
}

// Compiled again whenever the source or its approval changes; never when they do not match. Watched
// by the code itself, not the widget: the stored widgets are read again every few seconds, each read
// a new object with the same code, which would compile it - and flash the spinner - every time.
watch([() => source.value?.source ?? null, approved], async([code, approval]) => {
  const widget = code === null ? null : source.value;

  compiled.value = null;
  error.value = '';
  dropStyles();

  if (!widget) {
    state.value = 'missing';

    return;
  }
  if (!approval) {
    state.value = 'pending';

    return;
  }

  state.value = 'loading';

  if (await widgetHash(widget.source) !== approval) {
    state.value = 'changed';

    return;
  }

  try {
    const { compileWidget } = await import(/* webpackChunkName: "generated-widget-compiler" */ '../../templating/widget-compiler');
    const out: CompiledWidget = compileWidget(widget.source, `${ widget.name }.vue`);

    styles = out.styles;
    compiled.value = { ...out.component, components: { ...COMPONENTS, ...(out.component.components as Record<string, Component> || {}) } } as Component;
    state.value = 'ready';
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
    state.value = 'failed';
  }
}, { immediate: true });

onBeforeUnmount(dropStyles);

// A widget that throws while drawing is shown as failed, not taken down with the page
onErrorCaptured((e) => {
  error.value = (e as Error)?.message || String(e);
  state.value = 'failed';

  return false;
});

// ---- what the widget is given ----

const clusterUrl = (path: string) => `/k8s/clusters/${ encodeURIComponent(cluster.value) }/v1/${ path }`;

/**
 * Read-only access to the widget's cluster - its whole API surface. Each call reads; nothing writes.
 */
const api = computed(() => ({
  cluster: cluster.value,

  /** Every resource of a type (in one namespace, if given): plain objects, as the API returns them. */
  async list(type: string, opts: { namespace?: string; limit?: number } = {}): Promise<Record<string, unknown>[]> {
    const res = await store.dispatch('management/request', { url: `${ clusterUrl(opts.namespace ? `${ type }/${ opts.namespace }` : type) }?limit=${ opts.limit || 500 }&exclude=metadata.managedFields` });

    return res?.data || [];
  },

  /** One resource: `id` is "name", or "namespace/name". */
  get(type: string, id: string): Promise<Record<string, unknown>> {
    return store.dispatch('management/request', { url: clusterUrl(`${ type }/${ id }`) });
  },

  /** How many of every type the cluster has, with states and per namespace (the cluster's `counts`). */
  counts(): Promise<Record<string, unknown>> {
    return fetchClusterCounts(store, cluster.value);
  },

  /** How many of a type are in each state in each namespace: [{ type, namespace, state, count }]. */
  async states(type: string) {
    return countsFromSummaries(await fetchStateSummaries(store, cluster.value, [type]));
  },

  /** Rancher's colour for a state: success, info, warning, error or disabled. */
  stateColor(state: string): StateColor {
    const raw = colorForState(`${ state }`.toLowerCase(), false, false).replace('text-', '');

    return (raw === 'darker' ? 'disabled' : raw) as StateColor;
  },

  /** A state as Rancher writes it ("CrashLoopBackOff", "Running"). */
  stateLabel: (state: string) => stateDisplay(state, true),

  /** A type's plural name, as Rancher names it. */
  typeLabel: (type: string) => store.getters['i18n/withFallback'](`typeLabel."${ type }"`, { count: 2 }, type),

  /** Where a type's list - or one resource - is, in the widget's cluster. */
  route(type: string, id?: string, namespace?: string): RouteLocationRaw {
    if (!id) {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster: cluster.value, product: EXPLORER, resource: type
        }
      };
    }

    return namespace ? {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster: cluster.value, product: EXPLORER, resource: type, namespace, id
      }
    } : {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster: cluster.value, product: EXPLORER, resource: type, id
      }
    };
  },
}));

const message = computed(() => {
  if (!cluster.value && state.value === 'ready') {
    return t(NO_CLUSTER);
  }

  return state.value === 'ready' || state.value === 'loading' ? '' : t(`configurableViews.generated.${ state.value }`, { name: props.widget.component, error: error.value });
});
</script>

<template>
  <WidgetCard
    v-if="message"
    :title="widget.title || source?.displayName || ''"
    :error="message"
  />
  <Loading
    v-else-if="state === 'loading'"
    mode="relative"
  />
  <div
    v-else
    class="wgen"
  >
    <h3
      v-if="widget.title"
      class="wgen__title"
    >
      {{ widget.title }}
    </h3>
    <component
      :is="compiled"
      :key="cluster"
      :cluster="cluster"
      :api="api"
      :title="widget.title"
    />
  </div>
</template>

<style lang="scss" scoped>
.wgen__title {
  font-weight: 600;
  margin:      0 0 10px;
}
</style>
