<script>
import { mapState } from 'vuex';
import { stringify } from '@/utils/error';

export default {
  layout: 'plain',

  data() {
    const home = this.$router.resolve({ name: 'index' }).href;
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
      <div class="row mb-20">
        <div class="col span-6 p-20">
          <h1 v-if="error.status">
            HTTP Error {{ error.status }}: {{ error.statusText }}
          </h1>
          <h1 v-else>
            Error
          </h1>
          <h2 v-if="error" class="text-secondary">
            {{ displayError }}
          </h2>
          <p>
            <a :href="home" class="btn role-primary">Reload</a>
          </p>
        </div>

        <div class="col span-6 desert-landscape" />
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
      background-image: url('~assets/images/pl/error-desert-landscape.svg');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      height: 75vh;
    }
  }
</style>
