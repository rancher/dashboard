<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
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
    <template v-else-if="row.isImported">
      {{ t('cluster.provider.imported') }}
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template>
    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
