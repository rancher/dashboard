<script>
import EmberPage from '@/components/EmberPage';

const PAGES = {
  'global-dns-entries':   '/g/dns/entries/index/',
  'global-dns-providers': '/g/dns/providers/index/',
  catalogs:               '/g/catalog',
  'rke-drivers':          '/n/drivers/cluster',
  'rke-templates':        '/g/rke-templates/index',
};

export default {
  components: { EmberPage },

  data() {
    const page = this.$route.params.page;
    let src;

    if (page) {
      src = PAGES[page];
    }

    return {
      src,
      page
    };
  }
};
</script>

<template>
  <EmberPage v-if="src" :src="src" :fixed="true" />
  <div v-else>
    <h1>Page Not Found</h1>
    <h2>{{ page }}</h2>
  </div>
</template>
