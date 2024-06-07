<script>
import { authProvidersInfo } from '@shell/utils/auth';

export default {
  async fetch() {
    const authInfo = await authProvidersInfo(this.$store);

    if (authInfo.enabled?.length) {
      const authProvider = authInfo.enabled[0];

      const {
        logoutAllSupported, logoutAllEnabled, logoutAllForced, configType
      } = authProvider;

      if (configType === 'saml' && logoutAllSupported && logoutAllEnabled && logoutAllForced) {
        // SAML - force SLO (logout from all apps)
        await this.$store.dispatch('auth/logout', {
          force: true, slo: true, provider: authProvider
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
