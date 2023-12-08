<script>
import Login from '@shell/mixins/login';

export default {
  mixins: [Login],

  methods: {
    login() {
      const { requestId, publicKey } = this.$route.query;

      this.$store.dispatch('auth/redirectTo', {
        provider: this.name,
        publicKey,
        requestId,
      });
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
