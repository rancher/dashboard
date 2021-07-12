<script>
import IndentedPanel from '@/components/IndentedPanel';

// List and map of the available documents in the content/docs folder
const docs = require.context('@/content/docs', true).keys();
const docsMap = docs.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

export default {
  layout: 'home',

  components: { IndentedPanel },

  async asyncData({ store, $content, params }) {
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

    let doc = null;

    if (locale) {
      doc = await $content('docs', locale, docName).fetch();
    }

    return { doc };
  },
};
</script>
<template>
  <IndentedPanel>
    <h1 class="breadcrumbs">
      <nuxt-link :to="{name: 'home'}">
        {{ t('nav.home') }}
      </nuxt-link>
      <span v-if="doc">> {{ doc.title }}</span>
    </h1>
    <nuxt-content v-if="doc" :document="doc" />
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

  ::v-deep .nuxt-content-container {
    .nuxt-content {
      margin-bottom: 40px;

      h2 {
        font-size: 18px;
        margin: 10px 0;
      }
      h3 {
        font-size: 16px;
        margin: 10px 0;
      }
      p {
        line-height: 18px;
      }
      p:not(:last-child) {
        margin-bottom: 12px;
      }
      ul {
        > li:not(:last-child) {
          margin-bottom: 5px;
        }
      }
      table {
        border: 1px solid var(--border);
        border-collapse: collapse;

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
  }

</style>
