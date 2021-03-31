<script>
import CountGauge from '@/components/CountGauge';
import { NAME as EXPLORER } from '@/config/product/explorer';
import { COUNT } from '@/config/types';
import { colorForState } from '@/plugins/steve/resource-instance';

export function colorToCountName(color) {
  switch (color) {
  case 'text-success':
  case 'text-info':
    return 'useful';
  case 'text-warning':
    return 'warningCount';
  default:
    return 'errorCount';
  }
}

export function resourceCounts(store, resource) {
  const inStore = store.getters['currentProduct'].inStore;
  const clusterCounts = store.getters[`${ inStore }/all`](COUNT)[0].counts;
  const summary = clusterCounts[resource].summary;

  const counts = {
    total:        summary.count || 0,
    useful:       summary.count || 0,
    warningCount: 0,
    errorCount:   0
  };

  Object.entries(summary.states || {}).forEach((entry) => {
    const color = colorForState(entry[0]);
    const count = entry[1];
    const countName = colorToCountName(color);

    counts['useful'] -= count;
    counts[countName] += count;
  });

  return counts;
}

export default {
  components: { CountGauge },
  props:      {
    resource: {
      type:     String,
      required: true
    },
    primaryColorVar: {
      type:     String,
      required: true
    },
  },

  computed: {
    resourceCounts() {
      return resourceCounts(this.$store, this.resource);
    },

    location() {
      return {
        name:     'c-cluster-product-resource',
        params:   { product: EXPLORER, resource: this.resource }
      };
    },

    name() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resource);

      return this.$store.getters['type-map/labelFor'](schema, this.resourceCounts.useful);
    },

    input() {
      return {
        plain:           true,
        name:            this.name,
        location:        this.location,
        primaryColorVar: this.primaryColorVar,
        ...this.resourceCounts
      };
    },
  },

};
</script>

<template>
  <CountGauge class="resource-gauge-two" v-bind="input" />
</template>
