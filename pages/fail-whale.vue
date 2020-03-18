<script>
import { mapState } from 'vuex';
import { stringify } from '@/utils/error';

export default {
  layout:     'unauthenticated',

  data() {
    const home = this.$router.resolve({ name: 'index' }).href;

    return { home };
  },

  computed: {
    ...mapState(['error']),

    displayError() {
      return stringify(this.error);
    },
  },

  fetch({ store, redirect }) {
    if ( process.client && !store.state.error ) {
      redirect(`/clusters`);
    }
  },

};
</script>

<template>
  <div class="m-20">
    <h1>Error<span v-if="error && error._status">: {{ error._status }} {{ error._statusText }}</span></h1>
    <div class="mt-20 mb-20">
      {{ displayError }}
    </div>
    <div>
      <a :href="home">Reload</a>
    </div>
  </div>
</template>
