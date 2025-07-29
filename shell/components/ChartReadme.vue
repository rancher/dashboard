<script>
import Markdown from '@shell/components/Markdown';

export default {
  components: { Markdown },
  props:      {
    versionInfo: {
      type:    Object,
      default: null,
    },
    showAppReadme: {
      type:    Boolean,
      default: true
    },
    hideReadmeFirstTitle: {
      type:    Boolean,
      default: true
    }
  },
  data() {
    const isStandalone = !!this.$route.query.versionInfo;
    const showAppReadme = this.$route.query.showAppReadme ? this.$route.query.showAppReadme === 'true' : this.showAppReadme;
    const hideReadmeFirstTitle = this.$route.query.hideReadmeFirstTitle ? this.$route.query.hideReadmeFirstTitle === 'true' : this.hideReadmeFirstTitle;

    if (isStandalone) {
      const theme = this.$route.query.theme || 'light';

      document.body.classList.add(`theme-${ theme }`);
    }

    return {
      appReadmeLoaded:  false,
      readmeLoaded:     false,
      localVersionInfo: this.versionInfo || (this.$route.query.versionInfo ? JSON.parse(atob(this.$route.query.versionInfo)) : null),
      isStandalone,
      localShowAppReadme:       showAppReadme,
      localHideReadmeFirstTitle: hideReadmeFirstTitle,
    };
  },
  computed: {
    appReadme() {
      return this.localVersionInfo?.appReadme || '';
    },
    readme() {
      return this.localVersionInfo?.readme || '';
    }
  },
};
</script>

<template>
  <div
    class="wrapper"
    :class="{'standalone': isStandalone}"
  >
    <div class="chart-readmes" :class="{'standalone': isStandalone}">
      <Markdown
        v-if="localShowAppReadme && appReadme"
        v-model:value="appReadme"
        :class="[localHideReadmeFirstTitle ? 'hidden-first-title' : '', 'md', 'md-desc', 'mb-20']"
        @loaded="appReadmeLoaded = true"
      />
      <h1
        v-if="localShowAppReadme && appReadme && readme && appReadmeLoaded && readmeLoaded"
        class="pt-10"
      >
        {{ t('catalog.install.appReadmeTitle') }}
      </h1>
      <Markdown
        v-if="readme"
        v-model:value="readme"
        class="md md-desc"
        :class="[localHideReadmeFirstTitle ? 'hidden-first-title' : '', 'md', 'md-desc']"
        @loaded="readmeLoaded = true"
      />
    </div>
    <div />
  </div>
</template>

<style lang="scss" scoped>
  .wrapper.standalone {
    width: 100%;
    min-height: 100vh;
    background: var(--body-bg);
  }
  .chart-readmes {
    & > h1 {
       border-top: var(--header-border-size) solid var(--header-border);
    }

    &.standalone {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }
  }
  .md {
    overflow: auto;
    max-width: 100%;
    line-height: 1.6;

    :deep() {
      * + H1,
      * + H2,
      * + H3,
      * + H4,
      * + H5,
      * + H6 {
        margin-top: 20px;
      }
    }

    :deep() code {
      font-size: 13.5px;
      white-space: break-spaces;
      word-wrap: break-word;
      padding-left: 5px;
      padding-right: 5px;
      border: 0;
    }

    :deep() pre {
      white-space: break-spaces;
      word-break: break-word;
    }

    :deep() p {
      margin-bottom: 0.5em;
    }
  }
  .hidden-first-title {
    :deep() > h1:first-of-type {
      display: none;
    }
  }

</style>
