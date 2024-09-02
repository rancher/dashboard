<script>
import EmbeddedPageView from '@shell/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
    return {
      PAGES: {
        'rke-drivers':       '/n/drivers/cluster',
        'rke-templates':     '/g/rke-templates/index',
        'cloud-credentials': '/g/security/cloud-credentials',
        'node-templates':    '/n/node-templates',
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
