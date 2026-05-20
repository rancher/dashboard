<script setup lang="ts">
import {
  ref, computed, watch, onMounted, onBeforeUnmount
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { STATES } from '@shell/plugins/dashboard-store/resource-class';
import { DOCS_BASE } from '@shell/config/private-label';
import { StateColor } from '@shell/utils/style';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import { useI18n } from '@shell/composables/useI18n';

interface SummaryEntry {
  type: string;
  summary: { property: string; counts: Record<string, number> }[] | null;
  error: string | null;
}

interface WorkloadEntry {
  type: string;
  label: string;
  total: number;
  stateCounts: Record<string, number>;
  error: string | null;
}

interface StateCardRow {
  label: string;
  color: StateColor;
  type: string;
  counts: { label: string; count: number }[];
}

interface StateCard {
  color: StateColor;
  rows: StateCardRow[];
}

const WORKLOAD_RESOURCE_TYPES: string[] = [
  WORKLOAD_TYPES.DEPLOYMENT,
  WORKLOAD_TYPES.DAEMON_SET,
  WORKLOAD_TYPES.STATEFUL_SET,
  WORKLOAD_TYPES.JOB,
  WORKLOAD_TYPES.CRON_JOB,
  POD,
];

const TRANSITIONING_STATES = new Set([
  'unknown', 'containerstatusunknown', 'imagepullbackoff',
  'crashloopbackoff',
]);

const ERROR_STATES = new Set([
  'init:error', 'init:crashloopbackoff',
]);

const COLOR_ORDER: Record<string, number> = {
  error: 0, warning: 1, disabled: 2, info: 3, success: 4
};

function toStateColor(state: string): StateColor {
  const key = (state || '').toLowerCase();

  if (ERROR_STATES.has(key)) {
    return 'error';
  }

  if (TRANSITIONING_STATES.has(key)) {
    return 'info';
  }

  const config = STATES[key];
  const color = config?.color || 'info';

  return (color === 'darker' ? 'disabled' : color) as StateColor;
}

const store = useStore();
const route = useRoute();
const { t } = useI18n(store);

const summaries = ref<SummaryEntry[]>([]);
const fetchError = ref<string | null>(null);
const loading = ref(true);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const activeNamespaces = computed<Record<string, boolean>>(() => {
  return store.getters['activeNamespaceCache'];
});

const isAllNamespaces = computed<boolean>(() => {
  return store.getters['isAllNamespaces'];
});

const namespaceSubtitle = computed<string>(() => {
  if (isAllNamespaces.value) {
    return t('workloadDashboard.subtitle.allNamespaces');
  }

  const namespaces = Object.keys(activeNamespaces.value);

  if (namespaces.length === 1) {
    return t('workloadDashboard.subtitle.filtered', { namespace: namespaces[0] });
  }

  return t('workloadDashboard.subtitle.filteredMultiple', { count: namespaces.length });
});

const workloadData = computed<WorkloadEntry[]>(() => {
  return summaries.value.map((entry) => {
    const label = t(`typeLabel."${ entry.type }"`, { count: 2 })?.trim() || entry.type;
    const stateCounts: Record<string, number> = {};
    let total = 0;

    if (entry.summary) {
      for (const s of entry.summary) {
        if (s.property === 'metadata.state.name') {
          Object.assign(stateCounts, s.counts);
          total = Object.values(s.counts).reduce((sum, c) => sum + c, 0);
        }
      }
    }

    return {
      type:  entry.type,
      label,
      total,
      stateCounts,
      error: entry.error,
    };
  });
});

const hasWorkloads = computed<boolean>(() => {
  return workloadData.value.some((w) => !w.error && w.total > 0);
});

const byStateCards = computed<StateCard[]>(() => {
  const colorGroups: Record<string, Record<string, { count: number; type: string }>> = {
    error:    {},
    warning:  {},
    info:     {},
    success:  {},
    disabled: {},
  };

  for (const w of workloadData.value) {
    if (w.error || w.total === 0) {
      continue;
    }

    for (const [state, count] of Object.entries(w.stateCounts)) {
      const color = toStateColor(state);

      if (!colorGroups[color][w.label]) {
        colorGroups[color][w.label] = { count: 0, type: w.type };
      }
      colorGroups[color][w.label].count += count;
    }
  }

  return Object.entries(colorGroups)
    .filter(([, typeMap]) => Object.keys(typeMap).length > 0)
    .map(([color, typeMap]) => ({
      color: color as StateColor,
      rows:  Object.entries(typeMap).map(([label, { count, type }]) => ({
        label,
        color:  color as StateColor,
        type,
        counts: [{ label: '', count }],
      })),
    }));
});

const byStateLayout = computed(() => {
  const cards = byStateCards.value;
  const hero = cards.find((c) => c.color === 'success') || null;
  const others = cards.filter((c) => c !== hero);

  let heroMode = 'default';

  if (cards.length === 1) {
    heroMode = 'full';
  } else if (others.length === 1) {
    heroMode = 'wide';
  }

  const subHero = (hero && others.length >= 3) ? others.find((c) => c.color === 'info') || null : null;

  const regularCards = subHero ? others.filter((c) => c !== subHero) : others;
  const gridRows = subHero ? Math.max(1, regularCards.length) : Math.max(1, Math.ceil(regularCards.length / 2));

  return {
    hero,
    subHero,
    cards: regularCards,
    heroMode,
    gridRows,
  };
});

const byTypeCards = computed(() => {
  return workloadData.value.filter((w) => !w.error && w.total > 0).map((w) => {
    const resources: { stateDisplay: string; stateSimpleColor: string }[] = [];

    const sortedStates = Object.entries(w.stateCounts)
      .sort(([a], [b]) => (COLOR_ORDER[toStateColor(a)] ?? 5) - (COLOR_ORDER[toStateColor(b)] ?? 5));

    for (const [state, count] of sortedStates) {
      for (let i = 0; i < count; i++) {
        resources.push({
          stateDisplay:     state?.charAt(0).toUpperCase() + state?.slice(1),
          stateSimpleColor: toStateColor(state),
        });
      }
    }

    return {
      title: w.label,
      type:  w.type,
      resources,
    };
  });
});

function resetNamespaceFilter(): void {
  store.dispatch('switchNamespaces', {
    ids: [],
    key: store.getters['clusterId'],
  });
}

function resourceRoute(type: string): RouteLocationRaw {
  return {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  route.params.cluster as string,
      product:  'explorer',
      resource: type,
    },
  };
}

async function fetchSummaries(): Promise<void> {
  try {
    const workloadPromises = WORKLOAD_RESOURCE_TYPES.map(async(type): Promise<SummaryEntry> => {
      const schema = store.getters['cluster/schemaFor'](type);

      if (!schema) {
        return {
          type, summary: null, error: t('workloadDashboard.errors.noAccess', { type })
        };
      }

      try {
        let url = `/v1/${ type }?summary=metadata.state.name`;

        if (!isAllNamespaces.value) {
          const namespaces = Object.keys(activeNamespaces.value);

          if (namespaces.length) {
            url += `&projectsornamespaces=${ namespaces.join(',') }`;
          }
        }

        const res = await store.dispatch('cluster/request', { url });

        return {
          type, summary: res.summary || [], error: null
        };
      } catch (e: any) {
        return {
          type, summary: null, error: e.message || t('workloadDashboard.errors.fetchType', { type })
        };
      }
    });

    summaries.value = await Promise.all(workloadPromises);
  } catch (e: any) {
    fetchError.value = e.message || t('workloadDashboard.errors.fetchAll');
  }
}

watch(activeNamespaces, () => {
  fetchSummaries();
});

onMounted(async() => {
  await fetchSummaries();
  loading.value = false;

  pollTimer = setInterval(() => {
    fetchSummaries();
  }, 5000);
});

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>

<template>
  <Loading v-if="loading" />

  <div
    v-else
    class="workload-dashboard"
  >
    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ Empty state ━━━ -->
    <div
      v-if="!hasWorkloads"
      class="empty-state"
    >
      <h1 class="m-0">
        {{ t('workloadDashboard.empty.title') }}
      </h1>
      <div class="empty-state-tips">
        <RichTranslation k="workloadDashboard.empty.message">
          <template #resetLink="{ content }">
            <a
              role="button"
              class="link"
              @click="resetNamespaceFilter"
              @keyup.enter="resetNamespaceFilter"
            >{{ content }}</a>
          </template>
        </RichTranslation>
        <RichTranslation
          k="workloadDashboard.empty.docsMessage"
          tag="div"
        >
          <template #docsLink="{ content }">
            <a
              :href="`${DOCS_BASE}/how-to-guides/new-user-guides/kubernetes-resources-setup/workloads-and-pods`"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="secondary-text-link"
            >
              {{ content }} <i class="icon icon-external-link" />
            </a>
          </template>
        </RichTranslation>
      </div>
    </div>

    <template v-else>
      <header class="row">
        <div class="col span-12 title">
          <h1 class="m-0">
            {{ t('workloadDashboard.title') }}
          </h1>
          <div class="sub-title text-muted">
            {{ namespaceSubtitle }}
          </div>
        </div>
      </header>
      <!-- ━━━ By State ━━━ -->
      <div class="section">
        <h4 class="m-0 text-muted">
          {{ t('workloadDashboard.sections.byState') }}
        </h4>
        <div
          class="bento-grid"
          :class="{ 'bento-grid--has-sub-hero': !!byStateLayout.subHero }"
          :style="{ 'grid-template-rows': 'repeat(' + byStateLayout.gridRows + ', ' + (byStateLayout.subHero ? '1fr' : 'auto') + ')' }"
        >
          <Card
            v-for="card in byStateLayout.cards"
            :key="card.color"
            class="state-card"
            :class="'state-card--' + card.color"
          >
            <ResourceRow
              v-for="(row, idx) in card.rows"
              :key="idx"
              :label="row.label"
              :to="resourceRoute(row.type)"
              :color="row.color"
              :counts="row.counts"
            />
          </Card>
          <Card
            v-if="byStateLayout.subHero"
            class="state-card bento-sub-hero"
            :class="'state-card--' + byStateLayout.subHero.color"
          >
            <ResourceRow
              v-for="(row, idx) in byStateLayout.subHero.rows"
              :key="idx"
              :label="row.label"
              :to="resourceRoute(row.type)"
              :color="row.color"
              :counts="row.counts"
            />
          </Card>
          <Card
            v-if="byStateLayout.hero"
            class="state-card bento-hero"
            :class="['state-card--' + byStateLayout.hero.color, 'bento-hero--' + byStateLayout.heroMode]"
          >
            <ResourceRow
              v-for="(row, idx) in byStateLayout.hero.rows"
              :key="idx"
              :label="row.label"
              :to="resourceRoute(row.type)"
              :color="row.color"
              :counts="row.counts"
            />
          </Card>
        </div>
      </div>

      <!-- ━━━ By Type ━━━ -->
      <div class="section">
        <h4 class="m-0 text-muted">
          {{ t('workloadDashboard.sections.byType') }}
        </h4>
        <div class="card-grid">
          <StatusCard
            v-for="card in byTypeCards"
            :key="card.title"
            :title="card.title"
            :row-to="resourceRoute(card.type)"
            :resources="card.resources"
            :showPercent="false"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .section {
    h4 {
      line-height: 21px;
    }
    gap: 16px;
    display: flex;
    flex-direction: column;
  }

  .title {
    gap: 4px;

    h1 {
      line-height: 32px;
    }

    .sub-title {
      line-height: 21px;
    }
  }

  .empty-state {
    text-align: center;
    padding: 72px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    h1 {
      line-height: 38px;
    }
    .empty-state-tips {
      font-size: 16px;
      line-height: 29px;
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-flow: dense;
    gap: 15px;
  }

  .bento-hero {
    grid-column: 3;
    grid-row: 1 / -1;

    &--full {
      grid-column: 1 / -1;

      :deep(.body) {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px 48px;
      }
    }

    &--wide {
      grid-column: 2 / -1;

      :deep(.body) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 48px;
      }
    }
  }

  .bento-sub-hero {
    grid-column: 2;
    grid-row: 1 / -1;
  }

  .bento-grid--has-sub-hero {
    .state-card:not(.bento-hero):not(.bento-sub-hero) {
      grid-column: 1;
    }
  }

  .state-card {
    :deep(.resource-row) {
      position: relative;
      padding-left: 20px;
      line-height: 20px;
      height: 24px;

      .left {
        flex-grow: 1;
      }

      .right .counts .state-dot {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    @each $color in (error, warning, info, success) {
      &--#{$color} {
        background: var(--#{$color}-banner-bg, rgba(var(--#{$color}-rgb), 0.1));
      }
    }
  }
}
</style>
