<script>
import Login from '@shell/mixins/login';
export default {
  mixins: [Login],

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
    // If this is a CLI login, we must have the correct respone type and the other params must not be empty
    invalidCLILogin() {
      const { requestId, publicKey, responseType } = this.$route.query;

      if (this.isCLILogin) {
        return responseType !== 'kubeconfig' || !requestId || !publicKey;
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
    <button
      v-if="!invalidCLILogin"
      ref="btn"
      class="btn bg-primary"
      style="font-size: 18px;"
      @click="login"
    >
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </button>
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
