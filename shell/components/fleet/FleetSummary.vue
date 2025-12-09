<script>
import { clone } from '@shell/utils/object';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import FleetStatus from '@shell/components/fleet/FleetStatus';
import FleetUtils from '@shell/utils/fleet';

export default {

  name: 'FleetSummary',

  components: { FleetStatus },

  props: {
    bundles: {
      type:    Array,
      default: () => [],
    },
    value: {
      type:     Object,
      required: true,
    },

    stateKey: {
      type:    String,
      default: 'fleet.fleetSummary.state'
    },
  },

  computed: {
    bundlesDefaultStates() {
      try {
        return FleetUtils.getBundlesDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey);
      } catch (error) {
        return {};
      }
    },

    resourcesDefaultStates() {
      try {
        return FleetUtils.getResourcesDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey);
      } catch (error) {
        return {};
      }
    },

    resourceName() {
      return this.value.metadata.name;
    },

    resourceNamespace() {
      return this.value.metadata.namespace;
    },

    bundleCounts() {
      const resources = this.bundles.filter((item) => item.namespace === this.resourceNamespace && item.appSourceName === this.resourceName);

      if (!resources.length) {
        return [];
      }

      const out = clone(this.bundlesDefaultStates);

      resources.forEach(({ status, metadata }) => {
        if (!status) {
          out[STATES_ENUM.UNKNOWN].count += 1;

          return;
        }

        const k = status?.summary?.ready > 0 && status?.summary.desiredReady === status?.summary?.ready;

        if (k) {
          out.ready.count += 1;

          return;
        }

        const state = metadata.state?.name?.toLowerCase();

        if (state && out[state]) {
          out[state].count += 1;

          return;
        }

        const { conditions } = status;

        const notReady = conditions.find(({ transitioning, message }) => {
          return transitioning && !message.includes(STATES_ENUM.ERROR) && !message.toLowerCase().includes(STATES_ENUM.ERR_APPLIED);
        });

        if (!!notReady) {
          out.notready.count += 1;

          return;
        }

        // check conditions
        const errApplied = conditions.find(({ error, message }) => !!error && message.toLowerCase().includes(STATES_ENUM.ERR_APPLIED));

        if (errApplied) {
          out[STATES_ENUM.ERR_APPLIED].count += 1;

          return;
        }

        const errorState = conditions.find(({ error, message }) => !!error && message.toLowerCase().includes(STATES_ENUM.ERROR));

        if (out[errorState]) {
          out[errorState].count += 1;

          return;
        }

        out.unknown.count += 1;
      });

      return Object.values(out).map((item) => {
        item.value = item.count;

        return item;
      });
    },

    resourceCounts() {
      const out = clone(this.resourcesDefaultStates);

      const resourceStatuses = this.value.allResourceStatuses;

      Object.entries(resourceStatuses.states)
        .filter(([_, count]) => count > 0)
        .forEach(([state, count]) => {
          const k = state?.toLowerCase();

          if (out[k]) {
            out[k].count += count;
          } else {
            out.unknown.count += count;
          }
        });

      return Object.values(out).map((item) => {
        item.value = item.count;

        return item;
      });
    },

  },

};
</script>

<template>
  <div class="row flexwrap">
    <FleetStatus
      v-if="bundleCounts.length"
      title="Bundles"
      :values="bundleCounts"
      value-key="count"
      data-testid="resource-bundle-summary"
    />
    <FleetStatus
      title="Resources"
      :values="resourceCounts"
      value-key="count"
      data-testid="resource-deployment-summary"
    />
  </div>
</template>
<style lang="scss" scoped>
   .flexwrap .fleet-status {
    max-width: 50%;
    margin-right: 15px;

    &:last-child {
      margin: 0
    }
  }
  .countbox {
    min-width: 150px;
    width: 12.5%;
    margin-bottom: 10px;
  }
</style>
