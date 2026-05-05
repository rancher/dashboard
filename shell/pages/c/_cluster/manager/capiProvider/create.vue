<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { CAPI } from '@shell/config/labels-annotations';

export default {
  name:       'CapiProviderCreate',
  components: { ResourceDetail },
  computed:   {
    CAPI_PROVIDER() {
      return CAPI.CAPI_PROVIDER;
    }
  },
};
</script>

<template>
  <ResourceDetail
    :resource-override="CAPI_PROVIDER"
    parent-route-override="c-cluster-manager-capiprovider"
  />
</template>
