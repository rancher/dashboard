<script>
import capitalize from 'lodash/capitalize';
import CountBox from '@/components/CountBox';
import { STATES, stateSort } from '@/plugins/steve/resource-class';
import FleetSummaryGraph from '@/components/formatter/FleetSummaryGraph.vue';
import { sortBy } from '@/utils/sort';
import FleetStatus from '~/components/fleet/FleetStatus.vue';
import SimpleBox from '~/components/SimpleBox.vue';

export default {
  name: 'FleetSummary',

  components: { CountBox, FleetSummaryGraph, FleetStatus, SimpleBox },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    bundles: {
      type:     Array,
      default: () => ([]),
    },

    stateKey: {
      type:    String,
      default: 'fleet.fleetSummary.state'
    }
  },

  computed: {

    totalResources() {
      return Object.values(this.counts).reduce((total, curr) => total + curr.value, 0)
    },
    values() {
      return sortBy(Object.values(this.counts), 'sort:desc');
    },

    counts() {
      const out = {
        ready: {
          value: 0,
          color: '--sizzle-success',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.success`, null, 'Success'),
          sort: stateSort('success'), 
        },
        info:    {
          value: 0,
          color: '--sizzle-info',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.info`, null, 'Info'),
          sort: stateSort('info'), 

        },
        warning: {
          value: 0,
          color: '--sizzle-warning',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.warning`, null, 'Warning'),
          sort: stateSort('warning'), 
        },
        error:   {
          value: 0,
          color: '--sizzle-error',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.error`, null, 'Error'),
          sort: stateSort('error'), 

        },
        unknown: {
          value: 0,
          color: '--sizzle-warning',
          label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.unknown`, null, 'Unknown'),
          sort: stateSort('warning'), 

        },
      };

      for (const k in this.value) {
        if (k.startsWith('desired')) {
          continue;
        }

        const mapped = STATES[k] || STATES['other'];

        if (out[k]) {
          out[k].value += this.value[k] || 0;
          out[k].color = '--sizzle-' + mapped.color;
        } else {
          out[k] = {
            value: this.value[k] || 0,
            color: '--sizzle-' + mapped.color,
            label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.${ k }`, null, capitalize(k)),
            sort: stateSort(mapped.color), 
          };
        }
      }
      return out;
    },
  },

  methods: { capitalize },
};
</script>

<template>
  <div class="fleet-dashboard">
    <SimpleBox>
        <div class="summary-info">
          <div class="title">
            Bundles
          </div>
          <div class="resources-count">
             {{counts.ready.value}} / {{totalResources}} Bundles ready
          </div>
        </div>
        <FleetStatus :values="values" />
    </SimpleBox>
     <SimpleBox>
        <div class="summary-info">
          <div class="title">
            Resources
          </div>
          <div class="resources-count">
             {{counts.ready.value}} / {{totalResources}} Resources ready
          </div>
        </div>
        <FleetStatus :values="values" />
    </SimpleBox>
  </div>
</template>
<style lang="scss" scoped>
  .summary-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  .fleet-dashboard {
    display: flex;

    .simple-box {
      width: 100%;
      
    }
  }
</style>
