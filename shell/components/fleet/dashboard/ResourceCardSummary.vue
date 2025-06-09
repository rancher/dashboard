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
    noClusters: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { typeLabel: this.t(`typeLabel."${ this.value.type }"`, { count: 1 }) };
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

      return sortBy(out, 'sort:asc');
    },

    noClustersWarning() {
      if (this.noClusters) {
        return this.t('fleet.dashboard.cards.noClusters', { type: this.typeLabel });
      }

      return null;
    },
  },
};
</script>

<template>
  <div class="summary-panel">
    <div class="details">
      <ProgressBarMulti
        class="state-parts"
        :values="stateParts"
      />
    </div>
    <div class="mt-5 summary">
      <div
        v-if="value.stateDescription"
        class="error mt-10"
      >
        <span
          v-clean-tooltip="value.stateDescription"
          class="label wrap-text"
          :class="{ 'text-error' : value.stateObj.error }"
        >
          {{ value.stateDescription }}
        </span>
      </div>
      <div
        v-else-if="noClusters"
        class="no-clusters"
      >
        <span
          v-clean-tooltip="noClustersWarning"
          class="wrap-text"
        >
          {{ noClustersWarning }}
        </span>
      </div>
      <div
        v-else
        class="count"
      >
        <div class="label">
          <div>
            <span class="large">{{ summary.partial }}</span>
            <span
              v-if="summary.partial !== summary.total && summary.total !== 0"
              class="label-secondary"
            >/{{ summary.total }}</span>
          </div>
          <div>
            <span class="label-secondary">{{ t('fleet.dashboard.cards.resourceSummary.part1') }}</span>
            <span class="large">{{ summary.clusters }}</span>
            <span class="label-secondary">{{ t('fleet.dashboard.cards.resourceSummary.part2', { count: summary.clusters }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .summary-panel {
    width: 100%;

    .progress {
      width: 100%;
      margin-top: 4px;
    }

    .progress, .progress * {
      height: 6px;
      border-right: 1px solid var(--body-bg);
    }

    .details {
      display: flex;
      align-items: center;
    }

    .summary {
      margin-top: 5px;

      .no-clusters {
        display: flex;
        align-items: center;
        margin-top: 10px;

        .icon {
          margin-right: 5px;
        }
      }

      .count {
        display: flex;
        align-items: center;

        .icon {
          margin-right: 3px;
        }

        .label {
          display: flex;
          gap: 8px;

          .large {
            font-size: 18px;
          }

          .label-secondary{
            color: var(--label-secondary);
          }
        }
      }
    }
  }

  .wrap-text {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
  }
</style>
