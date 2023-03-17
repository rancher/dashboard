<script>
export default {
  name:   'DefaultProductLayout',
  layout: 'default',
  data() {
    const product = this.$route.params?.product || 'Unknown';

    return { product, top: false };
  },
  middleware({ redirect, route, store } ) {
    if (route.meta) {
      const m = Array.isArray(route.meta) ? route.meta[0] : route.meta;

      if (m.redirect) {
        const name = m.redirect.name;

        if (name !== route.name) {
          return redirect(m.redirect);
        }
      }
    }
  }
};
</script>
<template>
  <div>
    <div
      v-if="top"
      class="default-page"
    >
      <i class="icon icon-extension" />
      <h1>Default Landing page for product <b>{{ product }}</b></h1>
    </div>
    <div v-else>
      <router-view />
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .default-page {
    display: flex;
    align-items: center;
    > .icon {
      padding-top: 100px;
      font-size: 64px;
      padding-bottom: 20px;
      opacity: 0.7;
    }
  }
</style>
