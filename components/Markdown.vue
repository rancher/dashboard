<script>
import Loading from '@/components/loading';

export default {
  components: { Loading },

  props: {
    value: {
      type:     String,
      required: true,
    }
  },

  data() {
    return {
      loaded:    false,
      marked:    null,
      dompurify: null,
    };
  },

  computed: {
    html() {
      return this.marked(this.value, { breaks: true });
    },

    sanitized() {
      return this.dompurify.sanitize(this.html);
    },
  },

  async mounted() {
    this.marked = (await import(/* webpackChunkName: "markdown" */ 'marked')).default;
    this.dompurify = (await import(/* webpackChunkName: "markdown" */ 'dompurify')).default;
    this.loaded = true;
  }
};
</script>

<template>
  <div v-if="loaded" v-html="sanitized" />
  <Loading v-else />
</template>
