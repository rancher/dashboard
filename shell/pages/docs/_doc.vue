<script>
import IndentedPanel from '@shell/components/IndentedPanel';
import Markdown from '@shell/components/Markdown';
import { generateToc } from './toc';

// List and map of the available documents in the content/docs folder
const docs = require.context('@shell/content/docs', true).keys();
const docsMap = docs.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});
const SHOW_REFRESH = false;

export default {
  layout: 'home',

  components: { IndentedPanel, Markdown },

  asyncData({ store, params }) {
    const showRefresh = SHOW_REFRESH;
    const docName = params.doc;
    const defaultLocale = store.getters['i18n/default']();
    let locale = store.getters['i18n/current']();

    const getPath = (locale, docName) => {
      const path = `./${ locale }/${ docName }.md`;

      return docsMap[path] ? locale : null;
    };

    locale = getPath(locale, docName);
    if (!locale) {
      locale = getPath(defaultLocale, docName);
    }

    let sideToc = false;
    let doc = null;

    if (locale) {
      doc = require(`@shell/content/docs/${ locale }/${ docName }.md`);
      sideToc = doc?.attributes?.sideToc || false;
      doc.body = doc.body || '';

      if (sideToc) {
        doc.toc = generateToc(doc.body);
      }
    }

    return {
      doc,
      locale,
      docName,
      showRefresh,
      timer:    null,
      selected: null,
      sideToc,
    };
  },

  mounted() {
    const main = document.getElementsByTagName('main');

    if (main && main.length === 1) {
      main[0].addEventListener('scroll', this.handleScroll);
      this.scroller = main[0];
    }

    this.initialHighlight();
  },
  destroyed() {
    clearTimeout(this.timer);
    if (this.scroller) {
      this.scroller.removeEventListener('scroll', this.handleScroll);
    }
  },

  methods: {
    goto(id) {
      const elm = document.getElementById(id);

      this.selected = id;
      this.initialHighlight();

      if (elm) {
        elm.scrollIntoView();
      }
    },

    async refresh() {
      this.doc = await this.$content('docs', this.locale, this.docName).fetch();
    },

    initialHighlight() {
      if (!this.sideToc) {
        return;
      }

      const id = this.selected || this.doc.toc[0].id;

      this.doc.toc.forEach((item) => {
        const tocElm = document.getElementById(`toc-link-${ item.id }`);

        if ( !tocElm ) {
          return;
        }

        if (item.id === id) {
          tocElm.classList.add('active');
        } else {
          tocElm.classList.remove('active');
        }
      });
    },

    handleScroll(event) {
      // Any code to be executed when the window is scrolled
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const top = event.srcElement.offsetTop;
        const y = event.srcElement.scrollTop - top - 20;
        let found = false;

        // Debounce scroll events
        this.doc.toc.forEach((item) => {
          const elm = document.getElementById(item.id);
          const tocElm = document.getElementById(`toc-link-${ item.id }`);

          if ( !tocElm ) {
            return;
          }

          let active;

          if (this.selected) {
            active = item.id === this.selected;
          } else {
            active = elm.offsetTop > y;
          }

          if (!active || found) {
            tocElm.classList.remove('active');
          } else {
            tocElm.classList.add('active');
            found = true;
          }
        });

        if (!found) {
          const last = this.doc.toc[this.doc.toc.length - 1].id;
          const tocElm = document.getElementById(`toc-link-${ last }`);

          if ( tocElm ) {
            tocElm.classList.add('active');
          }
        }

        this.selected = null;
      }, 50);
    }

  }
};
</script>
<template>
  <IndentedPanel>
    <h1 class="breadcrumbs">
      <nuxt-link :to="{name: 'home'}">
        {{ t('nav.home') }}
      </nuxt-link>
      <span v-if="doc">> {{ doc.attributes.title }}</span>
      <i
        v-if="showRefresh"
        class="icon icon-refresh doc-refresh"
        @click="refresh"
      />
    </h1>
    <div
      v-if="doc"
      id="doc-content"
      class="doc-content"
      :class="{'nuxt-content-side-toc': sideToc}"
    >
      <Markdown
        ref="scrollPanel"
        v-model="doc.body"
        class="doc-content-document"
        :class="{'nuxt-content-side-toc': sideToc}"
      />

      <div
        v-if="sideToc"
        class="toc"
      >
        <a
          v-for="bookmark in doc.toc"
          :id="`toc-link-${ bookmark.id }`"
          :key="bookmark.id"
          class="toc-link"
          :class="'depth-' + bookmark.depth"
          @click="goto(bookmark.id)"
        >
          {{ bookmark.text }}
        </a>
      </div>
    </div>
    <div v-else>
      {{ t('generic.notFound') }}
    </div>
  </IndentedPanel>
</template>
<style lang="scss" scoped>
  h1.breadcrumbs {
    font-size: 18px;
    margin: 20px 0;
  }

  .doc-content {
    .toc {
      position: fixed;
      width: 20%;
      top: 100px;
      right: 5%;

      .toc-link {
        display: block;
        margin-bottom: 10px;
        padding-left: 4px;
        border-left: 4px solid;
        border-color: transparent;
        &:hover {
          cursor: pointer;
        }
        &.active {
          border-color: var(--link) ;
        }
      }
      .depth-3 {
        margin-left: 10px;
      }
    }
  }

  .doc-refresh {
    cursor: pointer;

    &:hover {
      color: var(--link);
    }
  }
</style>
<style lang="scss">
  .doc-content {
    P {
      font-size: 14px;
      margin-bottom: 10px;
      line-height: 16px;
    }

    ul > li {
      margin-bottom: 5px;
    }

    &.nuxt-content-side-toc {
      .doc-content-document {
        width: 75%;
      }
    }

    .doc-icon {
      font-size: 18px;
      line-height: normal;
      border: 1px solid var(--border);
      border-radius: 5px;
      margin: 0 5px;
    }

    svg.doc-icon {
      fill: var(--body-text);
    }
  }

  .doc-content-document {
    margin-bottom: 100px;
    h1:not(:first-child) {
      margin-top: 30px;
    }

    h2 {
      font-size: 18px;
      margin: 25px 0 15px 0;
      text-decoration: underline;
    }
    h3 {
      font-size: 16px;
      margin: 10px 0;
      text-decoration: underline;
    }
    p {
      line-height: 20px;
    }
    p:not(:last-child) {
      margin-bottom: 12px;
    }
    ul {
      > li:not(:last-child) {
        margin-bottom: 10px;
      }
    }
    blockquote {
      margin: 1em 0 1em 0;
      border-left: 4px solid var(--info);
      padding-left: 5px;
    }
    table {
      border: 1px solid var(--border);
      border-collapse: collapse;

      thead > tr > th {
        background-color: var(--sortable-table-header-bg);
        line-height: 1.75em;
      }

      tbody > tr.table-group > td {
        background-color: var(--sortable-table-header-bg);
        font-weight: bold;
      }

      thead, tbody {
        tr {
          td, th {
            border: 1px solid var(--border);
            padding: 5px 5px;
          }
        }
      }
    }
  }
</style>
