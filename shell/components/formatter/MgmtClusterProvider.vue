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
      <span v-else>
        {{ row.machineProviderDisplay }}
      </span>
    </template>
    <!-- TODO: RC test case -->
    <!-- <template v-else-if="row.isImported">
      {{ t('cluster.provider.imported') }}
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template> -->
    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
