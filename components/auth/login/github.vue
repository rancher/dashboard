<script>
export default {
  props: {
    focusOnMount: {
      type:     Boolean,
      required: true,
    }
  },

  mounted() {
    if ( this.focusOnMount ) {
      this.focus();
    }
  },

  methods: {
    focus() {
      this.$refs.btn.focus();
    },

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
