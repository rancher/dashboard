<script>
import Brand from '@shell/mixins/brand';

export default { mixins: [Brand] };
</script>

<template>
  <router-view :key="$route.path" />
</template>

<style lang="scss">
body, #__root, #__layout {
  height: 100%;
  background: var(--body-bg);
  color: var(--body-text);
}

// Standalone pages should not reserve dashboard layout areas (e.g. side nav and header).
#__layout {
  --header-height: 0px;
  --nav-width: 0px;
  --wm-vl-width: 0px;
  --wm-vr-width: 0px;
  --wm-height: 0px;
}
</style>
