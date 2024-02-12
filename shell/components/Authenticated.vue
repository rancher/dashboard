<script>
import { mapGetters } from 'vuex';
import Brand from '@shell/mixins/brand';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';

export default {
  mixins: [Brand, BrowserTabVisibility],
  async fetch() {
    await this.$store.dispatch('auth/authenticate');
  },
  computed: { ...mapGetters({ isAuthenticated: 'auth/isAuthenticated' }) },

  mounted() {
    if (this.isAuthenticated) {
      this.$emit('authenticated');
    }
  },

  watch: {
    isAuthenticated(value) {
      if (value) {
        this.$emit('authenticated');
      }
    }
  }
};
</script>
<template>
  <main class="main-layout">
    <div
      v-if="!$fetchState.pending"
      class="dashboard-root"
    >
      <slot v-if="isAuthenticated" />
      <div
        v-else
        class="logging-out"
      >
        <h1 v-t="'logout.message'" />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  main .logging-out {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
  }
</style>
