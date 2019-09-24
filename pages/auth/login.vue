<script>
export default {
  layout: 'unauthenticated',

  data() {
    return {
      timedOut:  typeof this.$route.query['timed-out'] !== 'undefined',
      loggedOut: typeof this.$route.query['logged-out'] !== 'undefined',
      err:       this.$route.query.err,
    };
  },

  methods: {
    login() {
      this.$store.dispatch('auth/redirectToGithub');
    }
  }
};
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      Rio Dashboard
    </h1>
    <div class="text-center mt-50 mb-50">
      <button class="btn bg-primary" style="font-size: 18px;" @click="login">
        Log In with GitHub
      </button>
    </div>
    <h4 v-if="loggedOut" class="text-success text-center">
      You have been logged out.
    </h4>
    <h4 v-if="timedOut" class="text-error text-center">
      Log in again to continue.
    </h4>
    <h4 v-else-if="err" class="text-error text-center">
      An error occurred logging in.  Please try again.
    </h4>
  </main>
</template>
