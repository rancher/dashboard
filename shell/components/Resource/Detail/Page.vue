<template>
  <div class="resource-detail-page">
    <div
      v-if="$slots['top-area']"
      class="top-area"
    >
      <slot name="top-area" />
    </div>
    <div
      v-if="$slots['middle-area']"
      class="middle-area mmt-6"
    >
      <slot name="middle-area" />
    </div>
    <div
      v-if="$slots['bottom-area']"
      class="bottom-area mmt-6"
    >
      <slot name="bottom-area" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.resource-detail-page {
  padding: 24px;

  :deep() .tabs.horizontal {
    border: none;
  }
  :deep() .tabs.horizontal + .tab-container {
    border: none;
    border-top: 1px solid var(--border);
    padding: 0;
    padding-top: 24px;
  }
}
</style>
