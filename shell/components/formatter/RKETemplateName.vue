<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
  }
};
</script>

<template>
  <div class="rke-template">
    <span>{{ value.displayName }}</span>
    <i
      v-if="value.upgrade"
      v-clean-tooltip="t('cluster.rkeTemplateUpgrade', { name: value.upgrade })"
      class="template-upgrade-icon icon-alert icon"
    />
  </div>
</template>

<style lang="scss" scoped>
  .rke-template {
    align-items: center;
    display: inline-flex;

    .template-upgrade-icon {
      border: 1px solid var(--warning);
      border-radius: 50%;
      color: var(--warning);
      margin-left: 4px;
      font-size: 14px;
      padding: 2px;
    }
  }
</style>
