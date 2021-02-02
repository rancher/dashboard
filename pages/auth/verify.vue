<script>
import { GITHUB_CODE, GITHUB_NONCE, BACK_TO } from '@/config/query-params';
import { get } from '@/utils/object';
const samlProviders = ['ping', 'adfs', 'keycloak', 'okta', 'shibboleth'];

function reply(err, code) {
  try {
    window.opener.window.onAuthTest(err, code);
    setTimeout(() => {
      window.close();
    }, 250);
  } catch (e) {
    window.close();
  }
}

export default {
  layout: 'unauthenticated',

  async fetch({ store, route, redirect }) {
    const code = route.query[GITHUB_CODE];
    const state = route.query[GITHUB_NONCE] || '';
    const isGoogle = state.includes('-googleoauth');
    const isTesting = state.includes('-test');

    if (isTesting) {
      return;
    }

    if (code) {
      const res = await store.dispatch('auth/verifyOAuth', {
        code,
        nonce:    route.query[GITHUB_NONCE],
        provider: isGoogle ? 'googleoauth' : 'github'
      });

      if ( res._status === 200) {
        const backTo = route.query[BACK_TO] || '/';

        redirect(backTo);
      } else {
        redirect(`/auth/login?err=${ escape(res) }`);
      }
    }
  },

  data() {
    const state = this.$route.query[GITHUB_NONCE] || '';

    const testing = state.includes('-test');

    return { testing };
  },

  mounted() {
    if ( this.testing ) {
      try {
        reply(null, this.$route.query[GITHUB_CODE] );
      } catch (e) {
        window.close();
      }
    } else {
      const { params, query } = this.$route;

      if ( window.opener && !get(params, 'login') && !get(params, 'errorCode') ) {
        const configQuery = get(query, 'config');

        if ( samlProviders.includes(configQuery) ) {
          if ( window.opener.window.onAuthTest ) {
            reply(null, null);
          } else {
            reply({ err: 'failure' });
          }
        }
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
