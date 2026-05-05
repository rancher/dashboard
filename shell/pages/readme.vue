<script>
import Loading from '@shell/components/Loading';
import ChartReadme from '@shell/components/ChartReadme';
import ChartMixin from '@shell/mixins/chart';
import isEqual from 'lodash/isEqual';

const readQueryBool = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  return `${ value }` === 'true';
};

export default {
  components: {
    ChartReadme,
    Loading,
  },

  mixins: [ChartMixin],

  async fetch() {
    await this.fetchChart();
  },

  computed: {
    showAppReadme() {
      return readQueryBool(this.$route.query.showAppReadme, false);
    },

    hideReadmeFirstTitle() {
      return readQueryBool(this.$route.query.hideReadmeFirstTitle, false);
    }
  },

  watch: {
    '$route.query'(neu, old) {
      if (!isEqual(neu, old) && Object.keys(neu).length > 0) {
        this.$fetch();
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <main
    v-else
    class="readme-page"
  >
    <div
      v-if="versionInfoError"
      class="readme-page__content"
    >
      {{ versionInfoError }}
    </div>
    <ChartReadme
      v-else-if="hasReadme"
      :version-info="versionInfo"
      :show-app-readme="showAppReadme"
      :hide-readme-first-title="hideReadmeFirstTitle"
      class="readme-page__content"
    />
    <div
      v-else
      class="readme-page__content"
    >
      {{ t('catalog.install.appReadmeMissing', {}, true) }}
    </div>
  </main>
</template>

<style lang="scss" scoped>
.readme-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px;
  background-color: var(--body-bg);
  color: var(--body-text);

  &__content {
    max-width: 1100px;
    margin: 0 auto;
  }
}
</style>
