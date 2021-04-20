<script>
import { LOGGED_OUT } from '@/config/query-params';

export default {
  layout: 'unauthenticated',

  async asyncData({ redirect, store, router }) {
    await store.dispatch('auth/logout', null, { root: true });
    redirect(302, `/auth/login?${ LOGGED_OUT }`);
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
