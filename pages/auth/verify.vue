<script>
import { GITHUB_CODE, GITHUB_NONCE, BACK_TO } from '@/config/query-params';
import { get } from '@/utils/object';
import { base64Decode } from '@/utils/crypto';
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
    const stateStr = route.query[GITHUB_NONCE] || '';

    let parsed;

    try {
      parsed = JSON.parse(base64Decode((stateStr)));
    } catch {
      return;
    }

    const { test, provider, nonce } = parsed;

    if (test) {
      return;
    }

    try {
      const res = await store.dispatch('auth/verifyOAuth', {
        code,
        nonce,
        provider
      });

      if ( res._status === 200) {
        const backTo = route.query[BACK_TO] || '/';

        redirect(backTo);
      } else {
        redirect(`/auth/login?err=${ escape(res) }`);
      }
    } catch (err) {
      redirect(`/auth/login?err=${ escape(err) }`);
    }
  },

  data() {
    const stateJSON = this.$route.query[GITHUB_NONCE] || '';

    let parsed = {};

    try {
      parsed = JSON.parse(base64Decode(stateJSON));
    } catch {
    }

    const { test } = parsed;

    return { testing: test };
  },

  mounted() {
    if ( this.testing ) {
      try {
        const { error: respError, error_description: respErrorDescription, [GITHUB_CODE]: code } = this.$route.query;
        const error = respErrorDescription || respError || (!code ? 'No code supplied by auth provider' : null);

        reply(error, code );
      } catch (e) {
        window.close();
      }
    } else {
      const { query } = this.$route;

      if ( window.opener ) {
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
        Testing Configuration&hellip;
      </span>
      <span v-else>
        Logging In&hellip;
      </span>
    </h1>
  </main>
</template>
