<script>
import { mapState } from 'vuex';
import { stringify } from '@/utils/error';

export default {
  layout:     'unauthenticated',

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
  <div>
    <h1>Error<span v-if="error && error._status">: {{ error._status }} {{ error._statusText }}</span></h1>
    <div>
      {{ displayError }}
    </div>
  </div>
</template>
