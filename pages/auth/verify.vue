<script>
import {
  AUTH_TEST, GITHUB_CODE, GITHUB_NONCE, _FLAGGED, BACK_TO
} from '@/config/query-params';

export default {
  layout:   'unauthenticated',

  data() {
    return { testing: this.$route.query[AUTH_TEST] === _FLAGGED };
  },

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

  mounted() {
    if ( this.testing ) {
      try {
        window.opener.window.onAuthTest(this.$route.query[GITHUB_CODE]);

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
      <span v-if="testing">
        Testing&hellip;
      </span>
      <span v-else>
        Logging In&hellip;
      </span>
    </h1>
  </main>
</template>
