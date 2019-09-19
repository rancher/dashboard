<script>
export default {
  layout: 'unauthenticated',

  async fetch({ store, route, redirect }) {
    const res = await store.dispatch('auth/verify', {
      code:  route.query.code,
      nonce: route.query.state,
    });

    if ( res === true ) {
      redirect('/');
    } else {
      redirect(`/auth/login?err=${ escape(res) }`);
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
