<script>
import EmbeddedPageView from '@/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
    return {
      PAGES: {
        'global-dns-entries':    '/g/dns/entries/index/',
        'global-dns-providers':  '/g/dns/providers/index/',
        'pod-security-policies': '/g/security/policies',
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
