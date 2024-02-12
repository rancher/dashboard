<script>
import BrandImage from '@shell/components/BrandImage';

export default {
  components: { BrandImage },

  props: {
    open: {
      type:     Boolean,
      required: true
    }
  }
};
</script>
<template>
  <div
    class="title"
    :class="{closed: !open}"
  >
    <div
      data-testid="top-level-menu"
      class="menu"
      @click="$emit('toggle')"
    >
      <svg
        class="menu-icon"
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      ><path
        d="M0 0h24v24H0z"
        fill="none"
      /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </div>
    <div class="side-menu-logo">
      <BrandImage
        data-testid="side-menu__brand-img"
        file-name="rancher-logo.svg"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .title {
    display: flex;
    height: 55px;
    flex: 0 0 55px;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    border-bottom: var(--header-border-size) solid var(--header-border);

    .menu {
      position: absolute;
      width: $app-bar-collapsed-width;
      height: 54px;
      top: 0;
      grid-area: menu;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .menu-icon {
      width: 25px;
      height: 25px;
      fill: var(--header-btn-text);
    }

    .side-menu-logo {
      align-items: center;
      display: flex;
      transform: translateX($app-bar-collapsed-width);
      opacity: 1;
      max-width: 200px;
      width: 100%;
      justify-content: center;
      transition: all 0.5s;
      overflow: hidden;
      & IMG {
        object-fit: contain;
        height: 21px;
        max-width: 200px;
      }
    }

    &.closed {
      .side-menu-logo  {
        opacity: 0;
      }
    }
  }
</style>
