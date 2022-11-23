<script>

export default {
  layout: 'unauthenticated',

  async asyncData({ redirect, store, router }) {
    await store.dispatch('auth/logout', null, { root: true });
  }
};
</script>

<template>
  <main class="main-layout">
    <h1 class="text-center mt-50">
      Logging Out&hellip;
    </h1>
  </main>
</template>
