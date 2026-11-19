<script>
import { sloAuthProviderOfPrincipal } from '@shell/utils/auth-providers';

export default {
  async fetch() {
    const publicAuthProviders = await this.$store.dispatch('auth/getAuthProviders');

    const sloAuthProvider = sloAuthProviderOfPrincipal(publicAuthProviders, this.$store.getters['auth/principalId']);

    if (!!sloAuthProvider) {
      const { logoutAllSupported, logoutAllEnabled, logoutAllForced } = sloAuthProvider;

      if (logoutAllSupported && logoutAllEnabled && logoutAllForced) {
        // force SLO (logout from all apps)
        await this.$store.dispatch('auth/logout', {
          force: true, slo: true, provider: sloAuthProvider
        }, { root: true });
      } else {
        // simple logout
        await this.$store.dispatch('auth/logout', { force: true }, { root: true });
      }
    } else {
      // simple logout
      await this.$store.dispatch('auth/logout', { force: true }, { root: true });
    }
  }
};
</script>

<template>
  <main
    class="main-layout"
    :aria-label="t('layouts.logout')"
  >
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
