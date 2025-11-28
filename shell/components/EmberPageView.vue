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

  computed: {
    page() {
      return this.$route.params.page;
    },

    src() {
      if (this.page) {
        return this.pages[this.page];
      }

      return undefined;
    }
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
