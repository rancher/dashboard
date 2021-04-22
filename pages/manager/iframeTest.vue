<script>
import EmberPage from '@/components/EmberPage';

export default {
  components: {
    EmberPage
  },

  mounted() {
    console.log('TEST PAGE mounted');
    this.src = '/g/rke-templates/index';
  },
};
</script>

<template>
  <EmberPage src="/g/rke-templates/index" :fixed="true" />
</template>
