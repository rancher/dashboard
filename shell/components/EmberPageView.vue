<script>
import EmberPage from '@shell/components/EmberPage';

export default {
  components: { EmberPage },

  props: {
    pages: {
      type:     Object,
      required: true
    },
  },

  data() {
    const page = this.$route.params.page;
    let src;

    if (page) {
      src = this.pages[page];
    }

    return {
      src,
      page
    };
  },

  computed: {
    path() {
      const page = this.currentPage;
      const pagePath = this.pages[page];

      if (!pagePath) {
        return '';
      }
      const query = this.$route.query;
      const q = Object.entries(query).map(e => `${ e[0] }=${ e[1] }`).join('&');

      return `${ pagePath }${ q ? `?${ q }` : '' }`;
    },

    currentPage() {
      return this.$route.params.page;
    },

    forceNew() {
      const page = this.currentPage;
      const pagePath = this.pages[page];

      return pagePath?.startsWith('/meta/auditui/') || pagePath?.endsWith('/quotas-cn');
    }
  },
};
</script>

<template>
  <EmberPage
    v-if="path"
    :src="path"
    :force-new="forceNew"
  />
  <div v-else>
    <h1>{{ t('generic.notFound') }}</h1>
    <h2>{{ currentPage }}</h2>
  </div>
</template>
