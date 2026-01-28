<script lang="ts">
// Shared AuditPolicy interface for all audit log policy components
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';

export default {
  name:       'DetailAuditPolicy',
  components: { ResourceTabs },
  mixins:     [CreateEditView],
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs
    :mode="mode"
    :value="value"
  />
</template>
