<script>
import { RcButton } from '@components/RcButton';
import Login from '@shell/mixins/login';

export default {
  components: { RcButton },
  mixins:     [Login],

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
      this.$store.dispatch('auth/redirectTo', { provider: this.name });
    },
  },
};
</script>

<template>
  <div class="text-center">
    <RcButton
      ref="btn"
      variant="primary"
      size="large"
      data-testid="login-provider-submit"
      @click="login"
    >
      {{ t('login.loginWithProvider', {provider: uniqueDisplayName}) }}
    </RcButton>
  </div>
</template>
