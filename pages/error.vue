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
    if ( !store.state.error ) {
      redirect(`/clusters`);
    }
  },

};
</script>

<template>
  <div>
    <h1>Error</h1>
    <div>
      {{ displayError }}
    </div>
  </div>
</template>
