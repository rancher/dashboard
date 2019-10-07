<script>
export default {
  layout: 'unauthenticated',

  async created() {
    await this.$store.dispatch('auth/logout', null, { root: true });
    await this.$router.replace({ path: '/auth/login?logged-out' });
  }
};
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      Logging Out&hellip;
    </h1>
  </main>
</template>
