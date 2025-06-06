<script setup lang="ts">

defineProps<{
  clusterId: string;
}>();

</script>

<template>
  <router-link
    :to="`/c/${clusterId}/apps/catalog.cattle.io.clusterrepo/create`"
    target="_blank"
    class="add-repo-link"
  >
    + <span class="secondary-text-link">{{ t('catalog.charts.addNew') }}</span>
  </router-link>
</template>

<style scoped lang="scss">
.add-repo-link {
  all: unset;
  cursor: pointer;
  color: var(--link-text-secondary);
  margin-left: 4px;

  span {
    margin-left: 4px;
  }
}
</style>
