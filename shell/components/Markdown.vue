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
      return this.marked.parse(this.value, {
        renderer: this.markedRenderer,
        breaks:   true
      });
    },

    sanitized() {
      return this.dompurify.sanitize(this.html);
    },
  },

  async mounted() {
    const marked = (await import(/* webpackChunkName: "markdown" */ 'marked'));
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
  <div
    v-if="loaded"
    class="markdown"
    v-html="sanitized"
  />
  <Loading v-else />
</template>

<style lang="scss">

::v-deep {
  P {
    font-size: initial;
    line-height: initial;
    font-weight: initial;
    letter-spacing: initial;
    font-style: normal;
  }
}

.markdown {
    TH {
      text-align: left;
    }

    table tr th {
      font-weight: bold;
      text-align: left;
      margin: 0;
      padding: 6px 13px;
    }

    table tr th {
      font-weight: bold;
      text-align: left;
      margin: 0;
      padding: 6px 13px;
    }

    table tr td {
      text-align: left;
      margin: 0;
      padding: 6px 13px;
    }

    table tr th :first-child, table tr td :first-child {
      margin-top: 0;
    }

    table tr th :last-child, table tr td :last-child {
      margin-bottom: 0;
    }
}

</style>
