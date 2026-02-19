<script>
import FleetBundles from '@shell/components/fleet/FleetBundles';

export default {
  name:       'ListBundle',
  components: { FleetBundles },
  props:      {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },
};
</script>

<template>
  <FleetBundles
    :resource="resource"
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
