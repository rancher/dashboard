<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { SECRET } from '@shell/config/types';

export default {
  name:       'ProjectSecretsPage',
  components: { ResourceDetail },
  data() {
    return { SECRET, STORE: 'management' };
  }
};
</script>

<template>
  <ResourceDetail
    :resourceOverride="SECRET"
    :storeOverride="STORE"
  />
</template>
