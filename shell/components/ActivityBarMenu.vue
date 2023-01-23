<script>
export default {
  name:    'ActivityBarMenu',
  methods: {
    click() {
      this.$emit('click');
    }
  },

};
</script>

<template>
  <div class="menu">
    <div
      class="menu-container"
      @click="click"
    >
      <span class="icon icon-2x icon-menu" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .menu {
    display: flex;
    padding: 0.75rem 0;

    .menu-container {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
      opacity: 1;

      .icon-menu {
        color: var(--darker-text);
        min-width: 24px;
        min-height: 24px;
      }
    }
  }
</style>
