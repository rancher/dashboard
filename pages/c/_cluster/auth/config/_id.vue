<script>
import ResourceDetail from '@/components/ResourceDetail';
import { MANAGEMENT } from '@/config/types';

export default {
  name:        'AuthConfigDetail',
  components:  { ResourceDetail },

  computed: {
    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    }
  }
};
</script>

<template>
  <ResourceDetail :resource-override="AUTH_CONFIG" />
</template>
