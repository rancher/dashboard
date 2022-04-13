<script>
import Login from '@shell/mixins/login';

export default {
  mixins: [Login],

  methods: {
    login() {
      this.$store.dispatch('auth/redirectTo', { provider: 'github' });
    },
  },
};
</script>

<template>
  <button ref="btn" class="btn role-primary" @click="login">
    Log In with GitHub
  </button>
</template>
