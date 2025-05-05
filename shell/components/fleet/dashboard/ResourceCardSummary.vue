<script>
import { colorForState, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { sortBy } from '@shell/utils/sort';
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

export default {

  name: 'FleetDashboardResourceCardSummary',

  components: { ProgressBarMulti },

  props: {
    value: {
      type:     Object,
      required: true
    },

    statePanel: {
      type:     Object,
      required: true
    },
  },

  computed: {
    counts() {
      return this.value.status?.resourceCounts || {};
    },

    countsPerCluster() {
      return (this.value.targetClusters || []).map(({ id }) => this.value.status?.perClusterResourceCounts?.[id] || { desiredReady: 0 });
    },

    summary() {
      const { desiredReady, ready } = this.counts;

      const partial = desiredReady === ready ? ready : desiredReady - ready;
      const total = desiredReady;
      const clusters = partial !== total && total !== 0 ? this.countsPerCluster.filter((c) => c.desiredReady !== c.ready).length : this.countsPerCluster.length;

      return {
        partial,
        total,
        clusters
      };
    },

    stateParts() {
      const keys = Object.keys(this.counts).filter((x) => !x.startsWith('desired'));

      const out = keys.map((key) => {
        const textColor = colorForState(key);

        return {
          color: textColor.replace(/text-/, 'bg-'),
          value: this.counts[key],
          sort:  stateSort(textColor, key),
        };
      }).filter((x) => x.value > 0);

      return sortBy(out, 'sort:desc');
    },

  },
};
</script>

<template>
  <div class="summary-panel">
    <div class="details">
      <span>{{ t('fleet.dashboard.resources') }}</span>
      <ProgressBarMulti
        class="state-parts"
        :values="stateParts"
      />
    </div>
    <div class="mt-5 summary">
      <div v-if="value.stateDescription">
        <span :class="{ 'text-error' : value.stateObj.error }">{{ value.stateDescription }}</span>
      </div>
      <div
        v-else
        class="description"
      >
        <i
          v-if="statePanel.id !== 'success'"
          class="icon-lg"
          :class="statePanel.icon"
          :style="{ color: statePanel.color }"
        />
        <div class="label">
          <span class="large">{{ summary.partial }}</span>
          <span v-if="summary.partial !== summary.total && summary.total !== 0">/{{ summary.total }}</span>
          &nbsp;
          <span>{{ t('fleet.dashboard.cards.resourceSummary.part1') }}</span>
          <span class="large">{{ summary.clusters }}</span>
          <span>{{ t('fleet.dashboard.cards.resourceSummary.part2', { count: summary.clusters }) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .summary-panel {
    .details {
      display: flex;
      align-items: center;
      gap: 5px;

      .state-parts {
        margin-top: 2px;
      }
    }

    .summary {
      margin-top: 5px;

      .description {
        display: flex;
        align-items: center;

        .icon {
          margin-right: 3px;
        }

        .label {
          .large {
            font-size: 18px;
          }
        }
      }
    }
  }
</style>
