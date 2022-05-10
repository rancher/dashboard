<script>
import EmbeddedPageView from '@shell/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
    return {
      PAGES: {
        apps:                   '/g/apps',
        catalogs:               '/g/catalog',
        'global-dns-entries':   '/g/dns/entries/index/',
        'global-dns-providers': '/g/dns/providers/index/',
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
