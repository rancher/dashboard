<script>
import { RcButton } from '@components/RcButton';
import Login from '@shell/mixins/login';

const KUBECONFIG_RESPONSE_TYPE = 'kubeconfig';

export default {
  components: { RcButton },
  mixins:     [Login],

  methods: {
    async login() {
      const { requestId, publicKey, responseType } = this.$route.query;

      const res = await this.$store.dispatch('auth/login', {
        provider: this.name,
        body:     {
          finalRedirectUrl: window.location.origin,
          requestId,
          publicKey,
          responseType
        }
      });

      const { idpRedirectUrl } = res;

      window.location.href = idpRedirectUrl;
    },
  },

  computed: {
    // If any of the 3 params is specified, this is a CLI login
    isCLILogin() {
      const {
        cli,
        requestId,
        publicKey,
        responseType
      } = this.$route.query;

      return cli || publicKey || responseType || requestId;
    },
    // The CLI asks for `kubeconfig` when no cluster is given and `kubeconfig_<clusterId>`
    // when one is, which Rancher splits back apart on the first underscore
    validResponseType() {
      const responseType = this.$route.query.responseType || '';
      const separator = responseType.indexOf('_');

      if (separator === -1) {
        return responseType === KUBECONFIG_RESPONSE_TYPE;
      }

      return responseType.slice(0, separator) === KUBECONFIG_RESPONSE_TYPE && !!responseType.slice(separator + 1);
    },
    // If this is a CLI login, we must have the correct response type and the other params must not be empty
    invalidCLILogin() {
      const { requestId, publicKey } = this.$route.query;

      if (this.isCLILogin) {
        return !this.validResponseType || !requestId || !publicKey;
      }

      return false;
    },
    cliLoginCode() {
      const { requestId } = this.$route.query;

      return requestId;
    },
    warningMessageKey() {
      const { cli } = this.$route.query;

      return cli === 'true' ? 'login.cli.warning' : 'login.cli.warningLegacy';
    }
  }
};
</script>

<template>
  <div class="text-center">
    <div
      v-if="isCLILogin"
      class="cli-login"
    >
      <div class="cli-message">
        {{ t('login.cli.welcome') }}
      </div>
      <div
        v-if="invalidCLILogin"
        class="cli-message cli-error"
      >
        {{ t('login.cli.invalidParams') }}
      </div>
      <template v-else>
        <div class="cli-message">
          {{ t(warningMessageKey, {}, true) }}
        </div>
        <div class="cli-login-code">
          {{ cliLoginCode }}
        </div>
      </template>
    </div>
    <RcButton
      v-if="!invalidCLILogin"
      ref="btn"
      variant="primary"
      size="large"
      data-testid="login-provider-submit"
      @click="login"
    >
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </RcButton>
  </div>
</template>
<style lang="scss" scoped>
  .cli-login {
    display: flex;
    flex-direction: column;
    align-items: center;

    > div {
      margin-bottom: 8px
    }

    .cli-message {
      font-size: 16px;

      &.cli-error {
        color: var(--error);
      }
    }

    .cli-login-code {
      font-family: 'Courier New', Courier, monospace;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 4px 8px;
      margin: 8px 0 16px 0;
      letter-spacing: 1px;
      font-size: 16px;
    }
  }
</style>
