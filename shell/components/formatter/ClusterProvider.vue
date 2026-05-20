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
    <div
      v-if="row.machineProviderDisplay !== row.provisionerDisplay"
      class="text-muted"
    >
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
