<script>

export default {
  async asyncData({ redirect, store, router }) {
    await store.dispatch('auth/logout', null, { root: true });
  }
};
</script>

<template>
  <main class="main-layout">
    <div>
      <h1 v-t="'logout.message'" />
    </div>
  </main>
</template>
<style lang="scss" scoped>
  main > div {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
</style>
