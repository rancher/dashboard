<script>
export default {
  layout: 'unauthenticated',

  async created() {
    const res = await this.$store.dispatch('auth/verify', {
      code:  this.$route.query.code,
      nonce: this.$route.query.state,
    });

    if ( res === true ) {
      this.$router.replace({ path: '/' });
    } else {
      this.$router.replace({ path: `/auth/login?err=${ escape(res) }` });
    }
  }
};
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      Logging In&hellip;
    </h1>
  </main>
</template>
