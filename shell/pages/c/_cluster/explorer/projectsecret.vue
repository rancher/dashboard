<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { _CLONE, _EDIT, MODE } from '@shell/config/query-params';
import { SECRET, VIRTUAL_TYPES } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';

export default {
  name:       'ProjectSecretsPage',
  components: { ResourceDetail },
  data() {
    return { STORE: STORE.MANAGEMENT };
  },
  computed: {
    // Because we want to use the normal secret for editing and we want to use the project_secret for detail we had to change the override based on mode
    resourceOverride() {
      const isEdit = [_EDIT, _CLONE].includes(this.$route.query[MODE]);

      return isEdit ? SECRET : VIRTUAL_TYPES.PROJECT_SECRETS;
    }
  }

};
</script>

<template>
  <!-- resourceOverride - used in both new and old resource details  -->
  <!-- storeOverride - used in old resource details (specifically edit)  -->
  <!--   v-bind="$attrs" - removes issues with `class` being passed through -->
  <ResourceDetail
    v-bind="$attrs"
    :resourceOverride="resourceOverride"
    :storeOverride="STORE"
  />
</template>
