<script>
import { configType } from '@shell/models/management.cattle.io.authconfig';

export default {
  async fetch() {
    const publicAuthProviders = await this.$store.dispatch('auth/getAuthProviders');

    const samlAuthProvider = publicAuthProviders.find((authProvider) => configType[authProvider.id] === 'saml');

    if (!!samlAuthProvider) {
      const { logoutAllSupported, logoutAllEnabled, logoutAllForced } = samlAuthProvider;

      if (logoutAllSupported && logoutAllEnabled && logoutAllForced) {
        // SAML - force SLO (logout from all apps)
        await this.$store.dispatch('auth/logout', {
          force: true, slo: true, provider: samlAuthProvider
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
