<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { _EDIT, MODE } from '@shell/config/query-params';
import { SECRET, VIRTUAL_TYPES } from '@shell/config/types';

export default {
  name:       'ProjectSecretsPage',
  components: { ResourceDetail },
  data() {
    return { STORE: 'management' };
  },
  computed: {
    // Because we want to use the normal secret for editing and we want to use the project_secret for detail we had to change the override based on mode
    resourceOverride() {
      const isEdit = this.$route.query[MODE] === _EDIT;

      return isEdit ? SECRET : VIRTUAL_TYPES.PROJECT_SECRETS;
    }
  }
};
</script>

<template>
  <ResourceDetail
    :resourceOverride="resourceOverride"
    :storeOverride="STORE"
  />
</template>
