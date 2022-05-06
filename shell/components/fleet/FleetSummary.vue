<script>
import capitalize from 'lodash/capitalize';
import { STATES, STATES_ENUM } from '@shell/plugins/steve/resource-class';
import FleetStatus from '@shell/components/fleet/FleetStatus';

const getResourceDefaultState = (labelGetter, stateKey) => {
  return {
    ready: {
      count: 0,
      color: STATES[STATES_ENUM.READY].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.READY }`, null, STATES[STATES_ENUM.READY].label )
    },
    info:    {
      count: 0,
      color: STATES[STATES_ENUM.INFO].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.INFO }`, null, STATES[STATES_ENUM.INFO].label )
    },
    warning: {
      count: 0,
      color: STATES[STATES_ENUM.WARNING].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.WARNING }`, null, STATES[STATES_ENUM.WARNING].label )
    },
    notready: {
      count: 0,
      color: STATES[STATES_ENUM.NOT_READY].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.NOT_READY }`, null, STATES[STATES_ENUM.NOT_READY].label )
    },
    error:   {
      count: 0,
      color: STATES[STATES_ENUM.ERROR].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.ERROR }`, null, STATES[STATES_ENUM.ERROR].label )

    },
    errapplied:   {
      count: 0,
      color: STATES[STATES_ENUM.ERR_APPLIED].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.ERR_APPLIED }`, null, STATES[STATES_ENUM.ERR_APPLIED].label )

    },
    waitapplied:   {
      count: 0,
      color: STATES[STATES_ENUM.WAIT_APPLIED].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.WAIT_APPLIED }`, null, STATES[STATES_ENUM.WAIT_APPLIED].label )

    },
    unknown: {
      count: 0,
      color: STATES[STATES_ENUM.UNKNOWN].color,
      label: labelGetter(`${ stateKey }.${ STATES_ENUM.UNKNOWN }`, null, STATES[STATES_ENUM.UNKNOWN].label )
    }
  };
};

export default {

  name: 'FleetSummary',

  components: { FleetStatus },

  props: {
    bundles: {
      type:    Array,
      default: () => [],
    },
    value:   {
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

    bundleCounts() {
      const resources = this.bundles.filter(item => item.metadata.name.startsWith(`${ this.repoName }-`)) || [];
      const out = { ...getResourceDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey) };

      resources.forEach(({ status, metadata }) => {
        const k = status?.summary.ready > 0 && status?.summary.desiredReady === status.summary.ready;

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
      const resources = this.value.status.resources || [];
      const out = { ...getResourceDefaultState(this.$store.getters['i18n/withFallback'], this.stateKey) };

      resources.forEach(({ state }) => {
        const k = state?.toLowerCase();

        if (out[k]) {
          out[k].count += 1;

          return;
        }
        out.unknown.count += 1;
      });

      return Object.values(out).map((item) => {
        item.value = item.count;

        return item;
      });
    },

  },

  methods: { capitalize },
};
</script>

<template>
  <div class="row flexwrap">
    <FleetStatus title="Bundles" :values="bundleCounts" value-key="count" />
    <FleetStatus title="Resources" :values="resourceCounts" value-key="count" />
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
