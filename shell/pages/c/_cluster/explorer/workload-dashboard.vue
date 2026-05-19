<script>
import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { Banner } from '@components/Banner';
import { STATES } from '@shell/plugins/dashboard-store/resource-class';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';

const WORKLOAD_RESOURCE_TYPES = {
  [WORKLOAD_TYPES.DEPLOYMENT]:   { label: 'Deployments' },
  [WORKLOAD_TYPES.DAEMON_SET]:   { label: 'DaemonSets' },
  [WORKLOAD_TYPES.STATEFUL_SET]: { label: 'StatefulSets' },
  [WORKLOAD_TYPES.JOB]:          { label: 'Jobs' },
  [WORKLOAD_TYPES.CRON_JOB]:     { label: 'CronJobs' },
  [POD]:                         { label: 'Pods' },
};

const DATA_SOURCE_OPTIONS = [
  { label: 'Real (API)', value: 'real' },
  { label: '1 State', value: '1-state' },
  { label: '2 States', value: '2-states' },
  { label: '3 States', value: '3-states' },
  { label: '4 States', value: '4-states' },
  { label: '5 States', value: '5-states' },
];

// States that the Steve server marks as transitioning (metadata.state.transitioning = true).
// For these, the real colorForState returns 'info' regardless of STATES[key].color.
const TRANSITIONING_STATES = new Set([
  'unknown', 'containerstatusunknown', 'imagepullbackoff',
  'crashloopbackoff',
]);

// States that the Steve server marks as error (metadata.state.error = true).
// For these, the real colorForState returns 'error' regardless of STATES[key].color.
const ERROR_STATES = new Set([
  'init:error', 'init:crashloopbackoff',
]);

function toStateColor(state) {
  const key = (state || '').toLowerCase();

  if (ERROR_STATES.has(key)) {
    return 'error';
  }

  if (TRANSITIONING_STATES.has(key)) {
    return 'info';
  }

  const config = STATES[key];
  const color = config?.color || 'info';

  return color === 'darker' ? 'disabled' : color;
}

export default {
  name:       'WorkloadDashboard',
  components: {
    Banner, Card, ResourceRow, StatusCard,
  },

  async fetch() {
    await this.fetchSummaries();
  },

  data() {
    return {
      summaries:         [],
      fetchError:        null,
      dataSource:        'real',
      dataSourceOptions: DATA_SOURCE_OPTIONS,
      pollTimer:         null,
    };
  },

  watch: {
    activeNamespaces() {
      if (this.dataSource === 'real') {
        this.fetchSummaries();
      }
    },
    dataSource() {
      this.applyDataSource();
    },
  },

  mounted() {
    this.pollTimer = setInterval(() => {
      if (this.dataSource === 'real') {
        this.fetchSummaries();
      }
    }, 5000);
  },

  beforeUnmount() {
    clearInterval(this.pollTimer);
  },

  methods: {
    resourceRoute(type) {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  'explorer',
          resource: type,
        },
      };
    },

    applyDataSource() {
      if (this.dataSource === 'real') {
        this.fetchSummaries();
      } else {
        this.summaries = [];
        this.fetchError = null;
      }
    },

    async fetchSummaries() {
      try {
        const workloadPromises = Object.keys(WORKLOAD_RESOURCE_TYPES).map(async(type) => {
          const schema = this.$store.getters['cluster/schemaFor'](type);

          if (!schema) {
            return {
              type, summary: null, error: `No access to ${ type }`
            };
          }

          try {
            let url = `/v1/${ type }?summary=metadata.state.name`;

            if (!this.isAllNamespaces) {
              const namespaces = Object.keys(this.activeNamespaces);

              if (namespaces.length) {
                url += `&projectsornamespaces=${ namespaces.join(',') }`;
              }
            }

            const res = await this.$store.dispatch('cluster/request', { url });

            return {
              type, summary: res.summary || [], error: null
            };
          } catch (e) {
            return {
              type, summary: null, error: e.message || `Failed to fetch ${ type }`
            };
          }
        });

        this.summaries = await Promise.all(workloadPromises);
      } catch (e) {
        this.fetchError = e.message || 'Failed to fetch workload summaries';
      }
    },
  },

  computed: {
    activeNamespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },

    isAllNamespaces() {
      return this.$store.getters['isAllNamespaces'];
    },

    workloadData() {
      return this.summaries.map((entry) => {
        const config = WORKLOAD_RESOURCE_TYPES[entry.type] || { label: entry.type };
        const stateCounts = {};
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
          label: config.label,
          total,
          stateCounts,
          error: entry.error,
        };
      });
    },

    /**
     * "By State": decompose each workload type's state counts into severity groups.
     * Aggregates counts per type within each severity card.
     */
    byStateCards() {
      const colorGroups = {
        error:    {},
        warning:  {},
        info:     {},
        success:  {},
        disabled: {},
      };

      for (const w of this.workloadData) {
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
          color,
          rows: Object.entries(typeMap).map(([label, { count, type }]) => ({
            label,
            color,
            type,
            counts: [{ label: '', count }],
          })),
        }));
    },

    /**
     * Bento-box layout: hero (success) card on the right spanning full height,
     * remaining cards fill a 2-column left grid.
     */
    byStateLayout() {
      const cards = this.byStateCards;
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
    },

    /**
     * "By Type": one StatusCard per workload type with fake resource objects.
     */
    byTypeCards() {
      const colorOrder = {
        error: 0, warning: 1, disabled: 2, info: 3, success: 4
      };

      return this.workloadData.filter((w) => !w.error && w.total > 0).map((w) => {
        const resources = [];

        const sortedStates = Object.entries(w.stateCounts)
          .sort(([a], [b]) => (colorOrder[toStateColor(a)] ?? 5) - (colorOrder[toStateColor(b)] ?? 5));

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
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div
    v-else
    class="workload-dashboard"
  >
    <header class="row">
      <div class="col span-12 title">
        <h1 class="m-0">
          Workloads Overview
        </h1>
        <div class="sub-title text-muted">
          For all namespaces
        </div>
      </div>
    </header>

    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ By State ━━━ -->
    <div class="section">
      <h4 class="m-0 text-muted">
        By State
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
        By Type
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
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
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

      ::v-deep .body {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px 48px;
      }
    }

    &--wide {
      grid-column: 2 / -1;

      ::v-deep .body {
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
    ::v-deep .resource-row {
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

    &--error {
      background: var(--error-banner-bg, rgba(var(--error-rgb), 0.1));
    }
    &--warning {
      background: var(--warning-banner-bg, rgba(var(--warning-rgb), 0.1));
    }
    &--info {
      background: var(--info-banner-bg, rgba(var(--info-rgb), 0.1));
    }
    &--success {
      background: var(--success-banner-bg, rgba(var(--success-rgb), 0.1));
    }
  }
}
</style>
