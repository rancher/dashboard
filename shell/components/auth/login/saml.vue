<script>
import Login from '@shell/mixins/login';
export default {
  emits:  ['error'],
  mixins: [Login],

  methods: {
    async login() {
      // eslint-disable-next-line no-console
      console.error('LOGGING IN WITH SAML!');
      const { requestId, publicKey, responseType } = this.$route.query;

      try {
        const res = await this.$store.dispatch('auth/login', {
          provider: this.name,
          body:     {
            finalRedirectUrl: window.location.origin,
            requestId,
            publicKey,
            responseType
          },
          queryParams: this.$route.query
        });

        // eslint-disable-next-line no-console
        console.error('SAML - PROMISE RESOLVED', res);

        if (res?.idpRedirectUrl) {
          // eslint-disable-next-line no-console
          console.error('SAML - REDIRECT');

          window.location.href = res.idpRedirectUrl;
        }
      } catch (err) {
        this.err = err;

        // eslint-disable-next-line no-console
        console.error('SAML - WE ARE ON ERROR STATUS');

        // emit error to parent so that it can displayed on the error Banner
        this.$emit('error', err);
      }
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
