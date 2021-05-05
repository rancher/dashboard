<script>
import EmbeddedPageView from '@/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
    return {
      PAGES: {
        'rke-drivers':   '/n/drivers/cluster',
        'rke-templates': '/g/rke-templates/index',
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
