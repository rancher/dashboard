<script>
import capitalize from 'lodash/capitalize';
import { STATES } from '@/plugins/steve/resource-class';
import FleetStatus from '@/components/fleet/FleetStatus';

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
      const out = {
        ready: {
          count: 0,
          color: 'success',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.success`, null, 'Success')
        },
        info:    {
          count: 0,
          color: 'info',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.info`, null, 'Info')

        },
        warning: {
          count: 0,
          color: 'warning',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.warning`, null, 'Warning')

        },
        error:   {
          count: 0,
          color: 'error',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.error`, null, 'Error')

        },
        unknown: {
          count: 0,
          color: 'unknown',
          label:  this.$store.getters['i18n/withFallback'](`${ this.stateKey }.unknown`, null, 'Unknown')
        }
      };

      resources.forEach((element) => {
        const k = element.status?.summary.ready > 0 && element.status?.summary.desiredReady === element.status.summary.ready;

        if (k) {
          out.ready.count += 1;

          return;
        }

        // check conditions
        const isError = element.status.conditions.find(condition => !!condition.error);

        if (isError) {
          out.error.count += 1;

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
      const out = {
        ready: {
          count: 0,
          color: 'success',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.success`, null, 'Success')
        },
        info:    {
          count: 0,
          color: 'info',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.info`, null, 'Info')

        },
        warning: {
          count: 0,
          color: 'warning',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.warning`, null, 'Warning')

        },
        error:   {
          count: 0,
          color: 'error',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.error`, null, 'Error')

        },
        unknown: {
          count: 0,
          color: 'warning',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.unknown`, null, 'Unknown')

        },
      };

      resources.forEach((element) => {
        const k = element.state?.toLowerCase();

        const mapped = STATES[k] || STATES['other'];

        if (out[k]) {
          out[k].count += 1;
          out[k].color = mapped.color;
        } else {
          out[k] = {
            count: 1,
            color: mapped.color,
            label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.${ k }`, null, capitalize(k))
          };
        }
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
