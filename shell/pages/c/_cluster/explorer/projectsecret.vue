<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { SECRET } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';

export default {
  name:       'ProjectSecretsPage',
  components: { ResourceDetail },
  data() {
    return { STORE: STORE.MANAGEMENT, SECRET };
  }
};
</script>

<template>
  <!-- resourceOverride - used in both new and old resource details  -->
  <!-- storeOverride - used in old resource details (specifically edit)  -->
  <!--   v-bind="$attrs" - removes issues with `class` being passed through -->
  <ResourceDetail
    v-bind="$attrs"
    :resourceOverride="SECRET"
    :storeOverride="STORE"
  />
</template>
