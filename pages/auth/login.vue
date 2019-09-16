<script>
export default {
  layout: 'unauthenticated',

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
      Login
    </h1>
    <div class="text-center mt-50">
      <button class="btn bg-primary" style="font-size: 18px;" @click="login">
        Login with GitHub
      </button>
    </div>
  </main>
</template>
