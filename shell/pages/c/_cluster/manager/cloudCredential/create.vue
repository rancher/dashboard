<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'CloudCredentialCreate',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    store-override="rancher"
    resource-override="cloudcredential"
    parent-route-override="c-cluster-manager-cloudCredential"
  />
</template>
