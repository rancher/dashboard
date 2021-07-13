<script>
import CountGauge from '@/components/CountGauge';
import { NAME as VIRTUAL } from '@/config/product/virtual';
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
  // const clusterCounts = store.getters[`${ inStore }/all`](resource)[0].counts;
  // const summary = clusterCounts[resource].summary;
  const resourceAll = store.getters[`${ inStore }/all`](resource);
  const warningCount = resourceAll?.[0]?.warningCount || 0;
  const errorCount = resourceAll?.[0]?.errorCount || 0;
  const counts = {
    total:        resourceAll.length || 0,
    useful:       resourceAll.length || 0,
    warningCount,
    errorCount
  };

  // Object.entries(summary.states || {}).forEach((entry) => {
  //   const color = colorForState(entry[0]);
  //   const count = entry[1];
  //   const countName = colorToCountName(color);
  //   counts['useful'] -= count;
  //   counts[countName] += count;
  // });
  counts['useful'] -= warningCount;
  counts['useful'] -= errorCount;

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
    visitResource: {
      type:     String,
      required: false,
      default:  null
    }
  },
  computed: {
    resourceCounts() {
      return resourceCounts(this.$store, this.resource);
    },
    location() {
      return {
        name:     'c-cluster-product-resource',
        params:   { product: VIRTUAL, resource: this.visitResource || this.resource }
      };
    },
    name() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resource);

      return this.$store.getters['type-map/labelFor'](schema, this.resourceCounts.useful);
    },
    input() {
      return {
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
