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
    <!-- TODO: RC confirm imported shows as 'cluster.provider.imported' and custom as 'cluster.provider.custom' -->

    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
<!-- TODO: RC test custom. imported. imported hosted. harvester, rke2/harvester, rke2/digitalocean-->
