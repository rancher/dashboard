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

function isSaml($route) {
  const { query } = $route;
  const configQuery = get(query, 'config');

  return samlProviders.includes(configQuery);
}

export default {
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

      redirect(`/auth/login?err=${ escape(out) }`);

      return;
    }
    let parsed;

    try {
      parsed = JSON.parse(base64Decode((stateStr)));
    } catch (err) {
      if (isSaml(route)) {
        // This is an ok failure. SAML has no state string so a failure is fine (see similar check in mounted).
        // This whole file could be re-written with that in mind, but this change keeps things simple and fixes a breaking addition
        return;
      }
      const out = store.getters['i18n/t'](`login.error`);

      console.error('Failed to parse nonce', stateStr, err); // eslint-disable-line no-console

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
      if ( window.opener ) {
        if (isSaml(this.$route)) {
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
