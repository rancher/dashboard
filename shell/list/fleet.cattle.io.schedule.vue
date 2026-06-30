<script>
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListSchedule',
  components: {
  },
  mixins: [ResourceFetch],
  props:  {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
  },

  data() {
  },
};
</script>

<template>
</template>
