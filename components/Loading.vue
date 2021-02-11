<script>
export default {
  props: {
    loading: {
      type:    Boolean,
      default: true,
    },
    // How to size and position the loading indicator - supports three modes:
    // 'content' - the content area only (not side nav or header)
    // 'main' - entire main view excluding the header, but including the side nav
    // 'full' - entire view including the header and the side nav
    mode: {
      type:    String,
      default: 'content',
    }
  },

};
</script>

<template>
  <div v-if="loading">
    <div class="overlay"></div>
    <div class="content" :class="{ 'content-content-mode' : mode === 'content', 'content-main-mode' : mode === 'main' }">
      <t k="principal.loading" />
    </div>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .overlay {
    z-index: z-index('loadingOverlay');
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .content {
    align-items: center;
    background-color: var(--overlay-bg);
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
    z-index: z-index('loadingContent');

    &-main-mode {
      top: var(--header-height);
    }

    &-content-mode {
      left: var(--nav-width);
      top: var(--header-height);
    }
  }
</style>
