<script>
import Banner from '@/components/Banner';

export default {
  layout: 'plain',

  components: { Banner },

  fetch({ store, redirect }) {
    const id = store.getters['defaultClusterId'];

    if ( id ) {
      redirect({ name: 'c-cluster', params: { cluster: id } });
    }
  }
};
</script>

<template>
  <div>
    <Banner label="You don't have any clusters..." color="error" />
  </div>
</template>
