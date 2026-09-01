<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'CloudCredentialEdit',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    resource-override="cloudcredential"
    parent-route-override="c-cluster-manager-cloudCredential"
  />
</template>
