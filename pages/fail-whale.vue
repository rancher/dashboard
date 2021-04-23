<script>
import { mapState } from 'vuex';
import { stringify } from '@/utils/error';

export default {
  layout: 'home',

  data() {
    const home = this.$router.resolve({ name: 'home' }).href;
    const store = this.$store;

    if ( process.client && !store.state.error && !store.state.cameFromError) {
      store.commit('cameFromError');
      this.$router.replace('/');
    }

    return { home };
  },

  computed: {
    ...mapState(['error']),

    displayError() {
      return stringify(this.error);
    },
  },

};
</script>

<template>
  <div v-if="error">
    <main class="error">
      <div class="text-center">
        <img src="~/assets/images/pl/error-desert-landscape.svg" width="900" height="300" />
        <h1 v-if="error.status">
          HTTP Error {{ error.status }}: {{ error.statusText }}
        </h1>
        <h1 v-else>
          Error
        </h1>
        <h2 v-if="error" class="text-secondary mt-20">
          {{ displayError }}
        </h2>
        <p class="mt-20">
          <a :href="home" class="btn role-primary">
            {{ t('nav.home') }}
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .error {
    overflow: hidden;

    .row {
      align-items: center;
    }

    h1 {
      font-size: 5rem;
    }

    .desert-landscape {
      img {
        max-width: 100%;
      }
    }
  }
</style>
