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
};
</script>

<template>
  <div class="text-center">
    <button
      ref="btn"
      class="btn bg-primary"
      style="font-size: 18px;"
      @click="login"
    >
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </button>
  </div>
</template>
