<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { MANAGEMENT } from '@shell/config/types';

export default {
  name:       'AuthConfigDetail',
  components: { ResourceDetail },
  computed:   {
    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    }
  },
};
</script>

<template>
  <ResourceDetail
    :resource-override="AUTH_CONFIG"
    :flex-content="true"
  />
</template>
