<script>
import {
  AUTH_TEST, GITHUB_CODE, GITHUB_NONCE, _FLAGGED, BACK_TO
} from '@/config/query-params';

export default {
  layout:   'unauthenticated',
  async fetch({ store, route, redirect }) {
    if ( route.query[AUTH_TEST] === _FLAGGED ) {
      return;
    }

    const res = await store.dispatch('auth/verifyGithub', {
      code:  route.query[GITHUB_CODE],
      nonce: route.query[GITHUB_NONCE],
    });

    if ( res === true ) {
      const backTo = route.query[BACK_TO] || '/';

      redirect(backTo);
    } else {
      redirect(`/auth/login?err=${ escape(res) }`);
    }
  },

  async mounted() {
    const route = this.$route;

    if ( route.query[AUTH_TEST] === _FLAGGED ) {
      try {
        await this.$store.dispatch('auth/testGithub', {
          code:   route.query[GITHUB_CODE],
          nonce:  route.query[GITHUB_NONCE],
          config: window.opener.window.authTestConfig,
        });

        reply(null);
      } catch (e) {
        reply(e);
      }
    }

    function reply(err) {
      try {
        window.opener.window.onAuthTest(err);
        setTimeout(() => {
          window.close();
        }, 250);
      } catch (e) {
        window.close();
      }
    }
  },
};
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      Logging In&hellip;
    </h1>
  </main>
</template>
