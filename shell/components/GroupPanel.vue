<script>
export default {
  props: {
    /**
     * Label for the group
     */
    label: {
      type:    String,
      default: null
    },
    /**
     * The i18n key to use for the label
     */
    labelKey: {
      type:    String,
      default: null
    },
  }
};
</script>
<template>
  <div class="group-panel-outer">
    <div class="group-panel">
      <div class="group-panel-title">
        <t
          v-if="labelKey"
          :k="labelKey"
        />
        <template v-else-if="label">
          {{ label }}
        </template>
      </div>
      <div class="group-panel-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .group-panel {
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 10px;
    position: relative;
    margin-top: 10px;
    .group-panel-title {
      position: absolute;
      top: -7px;
      background-color: var(--body-bg);
      padding: 0 5px;
    }
    .group-panel-content {
      position: relative;
    }
  }
</style>
