<script>
import { RcButton } from '@components/RcButton';
import Login from '@shell/mixins/login';

export default {
  components: { RcButton },
  mixins:     [Login],

  methods: {
    login() {
      this.$store.dispatch('auth/redirectTo', { provider: 'github' });
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
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </RcButton>
  </div>
</template>
