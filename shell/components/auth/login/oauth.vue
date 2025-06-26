<script>
import Login from '@shell/mixins/login';

export default {
  mixins: [Login],

  methods: {
    login() {
      // eslint-disable-next-line no-console
      console.error('LOGGING IN WITH OAUTH!!!');
      this.$store.dispatch('auth/redirectTo', { provider: this.name, queryParams: this.$route.query });
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
