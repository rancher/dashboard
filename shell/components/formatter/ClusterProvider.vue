<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
  }
};
</script>

<template>
  <div>
    <template v-if="row.machineProvider">
    {{ row.machineProviderDisplay }}
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template>
    <template v-else>
      {{ t('cluster.provider.imported') }}
    </template>
    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
  </div>
</template>
