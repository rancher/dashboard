<script>
import { LOGGED_OUT } from '@/config/query-params';

export default {
  layout: 'unauthenticated',

  async asyncData({ redirect, store, router }) {
    await store.dispatch('auth/logout', null, { root: true });
    const url = `/auth/login?${ LOGGED_OUT }`;

    if ( process.server ) {
      redirect(302, url);
    } else {
      window.location.href = url;
    }
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
