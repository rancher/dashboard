<script>
import Login from '@/mixins/login';

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
  <button ref="btn" class="btn bg-primary" style="font-size: 18px;" @click="login">
    Log In with GitHub
  </button>
</template>
