<script>
import Brand from '@shell/mixins/brand';

export default {
  mixins: [Brand],
  beforeMount() {
    this.$store.commit('setError', { error: new Error('404: This page could not be found') });
    this.$router.replace('/fail-whale');
  }
};
</script>

<template>
  <div class="dashboard-root" />
</template>
