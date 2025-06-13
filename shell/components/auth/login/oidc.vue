<script>
import Login from '@shell/mixins/login';

export default {
  mixins: [Login],

  computed: {
    uniqueDisplayName() {
      switch (this.name) {
      case 'cognito':
        return this.t('model.authConfig.description.cognito');
      default:
        return this.t('model.authConfig.description.oidc');
      }
    },
  },

  methods: {
    login() {
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
      {{ t('login.loginWithProvider', {provider: uniqueDisplayName}) }}
    </button>
  </div>
</template>
