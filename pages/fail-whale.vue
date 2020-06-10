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
    <h1 v-if="error.status">
      HTTP Error {{ error.status }}: {{ error.statusText }}
    </h1>
    <h1 v-else>
      Error
    </h1>
    <div v-if="error" class="mt-20 mb-20">
      {{ displayError }}
    </div>
    <div>
      <a :href="home">Reload</a>
    </div>
  </div>
</template>
