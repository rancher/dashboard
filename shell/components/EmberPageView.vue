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
};
</script>

<template>
  <EmberPage
    v-if="src"
    :src="src"
  />
  <div v-else>
    <h1>{{ t('generic.notFound') }}</h1>
    <h2>{{ page }}</h2>
  </div>
</template>
