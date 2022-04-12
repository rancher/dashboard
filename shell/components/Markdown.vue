<script>
import Loading from '@shell/components/Loading';

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
      return this.marked(this.value, {
        renderer: this.markedRenderer,
        breaks:   true
      });
    },

    sanitized() {
      return this.dompurify.sanitize(this.html);
    },
  },

  async mounted() {
    const marked = (await import(/* webpackChunkName: "markdown" */ 'marked')).default;
    const dompurify = (await import(/* webpackChunkName: "markdown" */ 'dompurify')).default;

    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;

    const base = this.$router.resolve(this.$route).href.replace(/#.*$/, '');

    renderer.link = function(href, title, text) {
      let external = true;

      // Relative links don't work, since they aren't relative to the dashboard page
      if (href.startsWith('./')) {
        return text;
      }

      if ( href.startsWith('#') ) {
        href = `${ base }${ href }`;
        external = false;
      }

      const rendered = linkRenderer.call(this, href, title, text);

      if ( external ) {
        return rendered.replace(/^<a /, '<a target="_blank" rel="nofollow noopener noreferrer" ');
      }

      return rendered;
    };

    dompurify.setConfig({ ADD_ATTR: ['target'] });

    this.marked = marked;
    this.markedRenderer = renderer;
    this.dompurify = dompurify;
    this.loaded = true;
    this.$emit('loaded', true);
  }
};
</script>

<template>
  <div v-if="loaded" class="markdown" v-html="sanitized" />
  <Loading v-else />
</template>

<style lang="scss" scoped>
  ::v-deep {
    P {
      font-size: initial;
      line-height: initial;
      font-weight: initial;
      letter-spacing: initial;
      font-style: normal;
    }

    TH {
      text-align: left;
    }
  }
</style>
