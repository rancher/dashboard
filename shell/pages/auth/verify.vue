<script>
import { GITHUB_CODE, GITHUB_NONCE, BACK_TO } from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { base64Decode } from '@shell/utils/crypto';
import loadPlugins from '@shell/plugins/plugin';

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
    const stateStr = route.query[GITHUB_NONCE];
    const {
      error, error_description: errorDescription, errorCode, errorMsg
    } = route.query;

    if (error || errorDescription || errorCode || errorMsg) {
      let out = errorDescription || error || errorCode;

      if (errorMsg) {
        out = store.getters['i18n/withFallback'](`login.serverError.${ errorMsg }`, null, errorMsg);
      }

      const openerLoc = window.opener?.location;
      const thisLoc = window.location;

      // Check to see if we are verifying auth from a config page - if we are, we should reply to it, rather than redirecting
      // This way we will show the error in the original window, rather than leaving a new window open with the error in it
      // (user probably can not do anything useful in the new window to rectify the error)
      if (window.opener && window.opener !== window && openerLoc && thisLoc &&
        openerLoc.origin === thisLoc.origin && openerLoc.pathname.startsWith('/c/local/auth/config/')) {
        reply(out, errorCode);

        return;
      }

      redirect(`/auth/login?err=${ escape(out) }`);

      return;
    }
    let parsed;

    try {
      parsed = JSON.parse(base64Decode((stateStr)));
    } catch (err) {
      const out = store.getters['i18n/t'](`login.error`);

      console.error('Failed to parse nonce'); // eslint-disable-line no-console

      redirect(`/auth/login?err=${ escape(out) }`);

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

        // Load plugins
        await loadPlugins({
          app:     store.app,
          store,
          $plugin: store.$plugin
        });

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
        const {
          error: respError, error_description: respErrorDescription, [GITHUB_CODE]: code, errorMsg
        } = this.$route.query;

        let error = respErrorDescription || respError || (!code ? 'No code supplied by auth provider' : null);

        if (errorMsg) {
          error = this.$store.getters['i18n/withFallback'](`login.serverError.${ errorMsg }`, null, errorMsg);
        }

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
  }
};
</script>

<template>
  <main class="main-layout">
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
