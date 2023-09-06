<script>
import { findBy } from '@shell/utils/array';
import { NORMAN } from '@shell/config/types';

export default {
  layout: 'unauthenticated',

  async asyncData({ redirect, store, router }) {
    let principal;

    try {
      const principals = await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals', force: true }
      });

      principal = findBy(principals, 'me', true);
    } catch (e) {
      // Maybe not Rancher
    }

    await store.dispatch('auth/logout', { provider: principal?.provider ?? '' }, { root: true });
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
