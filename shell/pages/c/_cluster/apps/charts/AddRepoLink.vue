<script setup lang="ts">

defineProps<{
  clusterId: string;
}>();

</script>

<template>
  <router-link
    :to="`/c/${clusterId}/apps/catalog.cattle.io.clusterrepo/create`"
    class="add-repo-link"
    tabindex="0"
    :aria-label="t('catalog.charts.addNewRepo.ariaLabel')"
  >
    <span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
    + <span class="secondary-text-link">{{ t('catalog.charts.addNewRepo.label') }}</span>
  </router-link>
</template>

<style scoped lang="scss">
.add-repo-link {
  all: unset;
  cursor: pointer;
  color: var(--link-text-secondary);
  margin-left: 4px;

  &:focus-visible, &:focus {
    @include focus-outline;
  }

  span {
    margin-left: 4px;
  }
}
</style>
