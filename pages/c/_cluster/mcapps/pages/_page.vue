<script>
import EmbeddedPageView from '@/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
    return {
      PAGES: {
        apps:     '/g/apps',
        catalogs: '/g/catalog',
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
