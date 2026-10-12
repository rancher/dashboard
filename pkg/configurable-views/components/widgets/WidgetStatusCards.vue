<script setup lang="ts">
import {
  computed, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useStateColor } from '@shell/composables/useStateColor';
import Loading from '@shell/components/Loading';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusSummaryCardProps } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';
import type { StatusBreakdownCardProps } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';
import { NAMESPACE } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchClusterCounts, fetchStateSummaries } from '../../templating/widget-data';
import {
  buildStatusCards, countsFromClusterCounts, countsFromSummaries, normalizeStatusCards,
  type StatusCardData, type StatusCount, type StatusRow
} from '../../templating/status-cards';
import type { WidgetSpec } from '../../templating/types';

// STATUS CARDS — a cluster's resources counted into cards: Pods by status, a card per namespace with
// its workloads by status, the top resources by count, what needs attention. What is counted and how
// it is cut is the widget's `status` (see templating/status-cards).
//
// Drawn with the dashboard's own overview cards: a card whose rows are STATES is the Workloads
// overview's per-type card (StatusSummaryCard - a bar, then each state with its count); rows of types
// or namespaces split by colour are its per-namespace card (StatusBreakdownCard). Without colours,
// every card is the plain list of the first, with no bar and no colour.
//
// Named types are read as state summaries - their real states, ImagePullBackOff and all. No named
// type means every type, read from the cluster's `counts` in one request: coarser states (error,
// in progress, the rest active), but all of them.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);
const { toStateColor, resolveStateColors } = useStateColor();

const config = computed(() => normalizeStatusCards(props.widget.status));

/** Every type at once comes from `counts`, whose states are coarse - judged by name, no lookups. */
const fromCounts = computed(() => !config.value.resources.length);

// A refresh, as the overview's own, but less often: it is one widget of several on a page.
const POLL_MS = 30000;

const counts = ref<StatusCount[]>([]);
const loading = ref(false);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
// A setting or cluster change mid-request must not let the old answer land.
let asked = 0;

async function load(): Promise<void> {
  const id = cluster.value;
  const mine = ++asked;

  if (!id) {
    counts.value = [];

    return;
  }

  try {
    if (fromCounts.value) {
      const all = await fetchClusterCounts(store, id);

      if (mine === asked) {
        counts.value = countsFromClusterCounts(all);
      }
    } else {
      const summaries = await fetchStateSummaries(store, id, config.value.resources);

      if (mine !== asked) {
        return;
      }
      await resolveStateColors(summaries);
      counts.value = countsFromSummaries(summaries);
      error.value = summaries.every((s) => s.error) ? t('configurableViews.status.error', { cluster: id }) : '';

      return;
    }
    error.value = '';
  } catch (e) {
    if (mine === asked) {
      error.value = (e as Error)?.message || t('configurableViews.status.error', { cluster: id });
    }
  }
}

async function reload(): Promise<void> {
  counts.value = [];
  error.value = '';
  loading.value = true;
  await load();
  loading.value = false;
}

watch(() => [cluster.value, config.value.resources.join(',')], reload);

function onVisibility(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (!document.hidden) {
    load();
    timer = setInterval(load, POLL_MS);
  }
}

onMounted(async() => {
  await reload();
  timer = setInterval(load, POLL_MS);
  document.addEventListener('visibilitychange', onVisibility);
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
  document.removeEventListener('visibilitychange', onVisibility);
});

// ---- the cards ----

function rancherColor(state: string, type: string): StateColor {
  if (fromCounts.value) {
    const raw = colorForState(state.toLowerCase(), false, false).replace('text-', '');

    return (raw === 'darker' ? 'disabled' : raw) as StateColor;
  }

  return toStateColor(state, type);
}

const data = computed<StatusCardData[]>(() => buildStatusCards(counts.value, config.value, { stateColor: rancherColor }));

const typeLabel = (type: string) => t(`typeLabel."${ type }"`, { count: 2 })?.trim() || type;

function label(key: string, dimension: string): string {
  if (dimension === 'state') {
    return stateDisplay(key, true);
  }

  return dimension === 'type' ? typeLabel(key) : key;
}

// Where a row leads: into the widget's cluster - a type's list (narrowed to the row's states when they
// are real ones), or a namespace.
function listRoute(type: string, states: string[] = []): RouteLocationRaw {
  return {
    name:   'c-cluster-product-resource',
    params: {
      cluster: cluster.value, product: EXPLORER, resource: type
    },
    ...(states.length && !fromCounts.value ? { query: { stateFilter: states.join(',') } } : {}),
  };
}

function namespaceRoute(namespace: string): RouteLocationRaw {
  return {
    name:   'c-cluster-product-resource-id',
    params: {
      cluster: cluster.value, product: EXPLORER, resource: NAMESPACE, id: namespace
    },
  };
}

/** The one type a row or card is about, when there is one - what a link can lead to. */
function typeOf(card: StatusCardData, row?: StatusRow): string {
  if (row?.dimension === 'type') {
    return row.key;
  }
  if (card.dimension === 'type') {
    return card.key;
  }

  return config.value.resources.length === 1 ? config.value.resources[0] : '';
}

function rowRoute(card: StatusCardData, row: StatusRow, states: string[]): RouteLocationRaw | undefined {
  if (row.dimension === 'namespace') {
    return namespaceRoute(row.key);
  }

  const type = typeOf(card, row);

  return type ? listRoute(type, row.dimension === 'state' ? [row.key] : states) : undefined;
}

function cardTitle(card: StatusCardData): string {
  if (card.dimension === 'none') {
    return props.widget.title || t(`configurableViews.status.defaultTitle.${ config.value.rows }`);
  }

  return label(card.key, card.dimension);
}

const plain = computed(() => config.value.colors === 'none');

interface DrawnCard {
  key: string;
  summary?: StatusSummaryCardProps;
  breakdown?: StatusBreakdownCardProps;
}

// A colour the cards can draw: a state the widget's own map leaves out is drawn neutral.
const drawn = (color: StateColor | null): StateColor => color || 'disabled';

const cards = computed<DrawnCard[]>(() => data.value.map((card) => {
  const title = cardTitle(card);
  const type = typeOf(card);
  const to = card.dimension === 'namespace' ? namespaceRoute(card.key) : type ? listRoute(type) : undefined;

  if (plain.value || config.value.rows === 'state') {
    const byColor = new Map<StateColor, number>();

    for (const row of card.rows) {
      byColor.set(drawn(row.color), (byColor.get(drawn(row.color)) || 0) + row.total);
    }

    return {
      key:     card.key || 'all',
      summary: {
        title,
        total:    card.total,
        to,
        segments: plain.value || !card.total ? [] : [...byColor.entries()].map(([color, n]) => ({ color, percent: (n / card.total) * 100 })),
        rows:     card.rows.map((row) => ({
          key:   row.key,
          label: label(row.key, row.dimension),
          color: drawn(row.color),
          count: row.total,
          to:    rowRoute(card, row, row.cells.flatMap((c) => c.states)),
        })),
      },
    };
  }

  return {
    key:       card.key || 'all',
    breakdown: {
      title,
      rows: card.rows.map((row) => ({
        key:    row.key,
        label:  label(row.key, row.dimension),
        to:     rowRoute(card, row, []),
        counts: row.cells.map((cell) => ({
          color: drawn(cell.color), count: cell.count, to: rowRoute(card, row, cell.states)
        })),
      })),
    },
  };
}));

const single = computed(() => config.value.cards === 'none');
</script>

<template>
  <div
    class="wstatus"
    :class="{ 'wstatus--plain': plain }"
  >
    <!-- A single card carries the title itself - unless there is nothing to put in it -->
    <h3
      v-if="widget.title && (!single || !cards.length)"
      class="wstatus__title"
    >
      {{ widget.title }}
    </h3>

    <p
      v-if="!cluster"
      class="text-muted m-0"
    >
      {{ t(NO_CLUSTER) }}
    </p>

    <Loading
      v-else-if="loading && !cards.length"
      mode="relative"
    />

    <p
      v-else-if="error"
      class="text-error m-0"
    >
      {{ error }}
    </p>

    <p
      v-else-if="!cards.length"
      class="text-muted m-0"
    >
      {{ t(config.only === 'all' ? 'configurableViews.status.empty' : 'configurableViews.status.allClear') }}
    </p>

    <div
      v-else
      class="wstatus__grid"
      :class="{ 'wstatus__grid--single': single }"
    >
      <template
        v-for="card in cards"
        :key="card.key"
      >
        <StatusSummaryCard
          v-if="card.summary"
          v-bind="card.summary"
        />
        <StatusBreakdownCard
          v-else-if="card.breakdown"
          v-bind="card.breakdown"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wstatus {
  &__title {
    font-weight: 600;
    margin:      0 0 10px;
  }

  // As the overview lays its cards out: as many columns as fit, the cards the same width
  &__grid {
    display:               grid;
    gap:                   15px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

    &--single {
      grid-template-columns: 1fr;
    }
  }

  // Without colours a card is a list: no bar, no colour beside a row
  &--plain :deep(.status-summary-card .indicator) {
    display: none;
  }
}
</style>
