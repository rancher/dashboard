<script>
import Loading from '@shell/components/Loading';

export default {
  emits: ['loaded'],

  components: { Loading },

  props: {
    value: {
      type:     String,
      required: true,
    }
  },

  data() {
    return {
      loaded: false,
      marked: null,
    };
  },

  computed: {
    html() {
      return this.marked.parse(this.value, {
        renderer: this.markedRenderer,
        breaks:   true
      });
    },
  },

  async mounted() {
    const marked = (await import(/* webpackChunkName: "markdown" */ 'marked'));

    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;

    const base = this.$router ? this.$router.resolve(this.$route).href.replace(/#.*$/, '') : '';

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

    this.marked = marked;
    this.markedRenderer = renderer;
    this.loaded = true;
    this.$emit('loaded', true);
  }
};
</script>

<template>
  <div
    v-if="loaded"
    v-clean-html="html"
    class="markdown"
  />
  <Loading v-else />
</template>

<style lang="scss">

:deep() {
  P {
    font-size: initial;
    line-height: initial;
    font-weight: initial;
    letter-spacing: initial;
    font-style: normal;
  }
}

.markdown {
    blockquote {
      color: rgb(101, 109, 118);
      border-left: 0.25em solid rgb(208, 215, 222);
      padding: 0 1em;
      margin-bottom: 16px;
    }

    table {
      border-collapse: collapse;
    }

    TH {
      text-align: left;
      border: 1px solid #e3e7eb;
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
      border: 1px solid #e3e7eb;
    }

    table tr th :first-child, table tr td :first-child {
      margin-top: 0;
    }

    table tr th :last-child, table tr td :last-child {
      margin-bottom: 0;
    }
}

</style>
