<script>
import {
  GITHUB_CODE, GITHUB_NONCE, BACK_TO, IS_SLO, _FLAGGED
} from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { base64Decode } from '@shell/utils/crypto';
import loadPlugins from '@shell/plugins/plugin';
import { LOGIN_ERRORS } from '@shell/store/auth';

const samlProviders = ['ping', 'adfs', 'keycloak', 'okta', 'shibboleth'];

const oauthProviders = ['github', 'googleoauth', 'azuread'];

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
  async fetch() {
    const code = this.$route.query[GITHUB_CODE];
    const stateStr = this.$route.query[GITHUB_NONCE];
    const {
      error, error_description: errorDescription, errorCode, errorMsg
    } = this.$route.query;

    if (error || errorDescription || errorCode || errorMsg) {
      let out = errorDescription || error || errorCode;

      if (this.isSlo) {
        console.error('Failed to log out of auth provider', error, errorDescription, errorCode, errorMsg); // eslint-disable-line no-console

        let out = this.$store.getters['i18n/withFallback'](`logout.specificError.unknown`);

        if (errorCode) {
          out = this.$store.getters['i18n/withFallback'](`logout.specificError.${ errorCode }`, null, out);
        }

        this.$router.replace(`/auth/login?${ IS_SLO }&err=${ escape(out) }`);

        return;
      } else {
        if (errorMsg) {
          out = this.$store.getters['i18n/withFallback'](`login.serverError.${ errorMsg }`, null, errorMsg);
        }

        this.$router.replace(`/auth/login?err=${ escape(out) }`);

        return;
      }
    }

    // check for existence of IS_SLO query param to differentiate between a login and a logout
    if (this.isSlo) {
      this.$store.dispatch('auth/uiLogout');

      return;
    }

    let parsed;

    try {
      parsed = JSON.parse(base64Decode((stateStr)));
    } catch (err) {
      if (isSaml(this.$route)) {
        // This is an ok failure. SAML has no state string so a failure is fine (see similar check in mounted).
        // This whole file could be re-written with that in mind, but this change keeps things simple and fixes a breaking addition
        return;
      }
      const out = this.$store.getters['i18n/t'](`login.error`);

      console.error('Failed to parse nonce', stateStr, err); // eslint-disable-line no-console

      this.$router.replace(`/auth/login?err=${ escape(out) }`);

      return;
    }

    const { test, provider, nonce } = parsed;

    if (test) {
      return;
    }

    try {
      const res = await this.$store.dispatch('auth/verifyOAuth', {
        code,
        nonce,
        provider
      });

      if ( res._status === 200) {
        const backTo = this.$route.query[BACK_TO] || '/';

        // Load plugins
        await loadPlugins({
          app:     this.$store.app,
          store:   this.$store,
          $plugin: this.$store.$plugin
        });

        this.$router.replace(backTo);
      } else {
        this.$router.replace(`/auth/login?err=${ escape(res) }`);
      }
    } catch (err) {
      let errCode = err;

      // If the provider is OAUTH, then the client error is not that the credentials are wrong, but that the user is not authorized
      if (oauthProviders.includes(provider) && err === LOGIN_ERRORS.CLIENT_UNAUTHORIZED) {
        errCode = LOGIN_ERRORS.USER_UNAUTHORIZED;
      }

      this.$router.replace(`/auth/login?err=${ escape(errCode) }`);
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

    // Is Single Log Out
    const isSlo = this.$route.query[IS_SLO] === _FLAGGED;

    return {
      testing: test,
      isSlo
    };
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
      <span v-else-if="isSlo">
        Logging Out&hellip;
      </span>
      <span v-else>
        Logging In&hellip;
      </span>
    </h1>
  </main>
</template>
