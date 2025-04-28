<script>
import { STATES, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import FleetStatus from '@shell/components/fleet/FleetStatus';

const getResourcesDefaultState = (labelGetter, stateKey) => {
  return [
    STATES_ENUM.READY,
    STATES_ENUM.NOT_READY,
    STATES_ENUM.WAIT_APPLIED,
    STATES_ENUM.MODIFIED,
    STATES_ENUM.MISSING,
    STATES_ENUM.ORPHANED,
    STATES_ENUM.UNKNOWN,
  ].reduce((acc, state) => {
    acc[state] = {
      count:  0,
      color:  STATES[state].color,
      label:  labelGetter(`${ stateKey }.${ state }`, null, STATES[state].label ),
      status: state
    };

    return acc;
  }, {});
};

const getBundlesDefaultState = (labelGetter, stateKey) => {
  return [
    STATES_ENUM.READY,
    STATES_ENUM.INFO,
    STATES_ENUM.WARNING,
    STATES_ENUM.NOT_READY,
    STATES_ENUM.ERROR,
    STATES_ENUM.ERR_APPLIED,
    STATES_ENUM.WAIT_APPLIED,
    STATES_ENUM.UNKNOWN,
  ].reduce((acc, state) => {
    acc[state] = {
      count:  0,
      color:  STATES[state].color,
      label:  labelGetter(`${ stateKey }.${ state }`, null, STATES[state].label ),
      status: state
    };

    return acc;
  }, {});
};

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

    repoName() {
      return this.value.metadata.name;
    },

    repoNamespace() {
      return this.value.metadata.namespace;
    },

    bundleCounts() {
      const resources = this.bundles.filter((item) => item.namespace === this.repoNamespace && item.repoName === this.repoName);

      if (!resources.length) {
        return [];
      }

      const out = { ...getBundlesDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey) };

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
      const out = { ...getResourcesDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey) };
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
      data-testid="gitrepo-bundle-summary"
    />
    <FleetStatus
      title="Resources"
      :values="resourceCounts"
      value-key="count"
      data-testid="gitrepo-deployment-summary"
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
