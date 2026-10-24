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
      <span v-if="row.isHarvester && row.isReady && !row.hasError">
        <a
          role="button"
          @click="row.goToHarvesterCluster()"
        >
          {{ row.machineProviderDisplay }}
        </a>
      </span>
      <span v-else-if="row.machineProviderDisplay">
        {{ row.machineProviderDisplay }}
      </span>
    </template>
    <template v-else-if="row.isImported">
      {{ t('cluster.provider.imported') }}
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template>
    <div
      v-if="row.importedDistroDisplay || row.machineProviderDisplay !== row.provisionerDisplay"
      class="text-muted"
    >
      {{ row.importedDistroDisplay || row.provisionerDisplay }}
    </div>
  </div>
</template>
