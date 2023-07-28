<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
  },
  data(props) {
    return {
      // The isImported getter on the provisioning cluster
      // model doesn't work for imported K3s clusters, in
      // which case it returns 'k3s' instead of 'imported.'
      // This is the workaround.
      isImported: props.row.mgmt?.providerForEmberParam === 'import'
    };
  },
};
</script>

<template>
  <div>
    <template v-if="row.machineProvider">
      <span v-if="row.isHarvester && row.mgmt && row.mgmt.isReady && !row.hasError">
        <a
          v-if="row.mgmt.isReady && !row.hasError"
          role="button"
          @click="row.goToHarvesterCluster()"
        >
          {{ row.machineProviderDisplay }}
        </a>
      </span>
      <span v-else>
        {{ row.machineProviderDisplay }}
      </span>
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template>
    <template v-else-if="isImported">
      {{ t('cluster.provider.imported') }}
    </template>
    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
