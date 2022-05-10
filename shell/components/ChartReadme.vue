<script>
import Markdown from '@shell/components/Markdown';

export default {
  components: { Markdown },
  props:      {
    versionInfo: {
      type:     Object,
      required: true
    },
  },
  data() {
    return {
      appReadmeLoaded: false,
      readmeLoaded:    false,
    };
  },
  computed: {
    appReadme() {
      return this.versionInfo?.appReadme || '';
    },
    readme() {
      return this.versionInfo?.readme || '';
    }
  },
};
</script>

<template>
  <div class="wrapper">
    <div class="chart-readmes">
      <Markdown v-if="appReadme" v-model="appReadme" class="md md-desc mb-20" @loaded="appReadmeLoaded = true" />
      <h1 v-if="appReadme && readme && appReadmeLoaded && readmeLoaded" class="pt-10">
        {{ t('catalog.install.appReadmeTitle') }}
      </h1>
      <Markdown v-if="readme" v-model="readme" class="md md-desc" @loaded="readmeLoaded = true" />
    </div>
    <div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .chart-readmes {
    & > h1 {
       border-top: var(--header-border-size) solid var(--header-border);
    }
  }
  .md {
    overflow: auto;
    max-width: 100%;

    ::v-deep {
      * + H1,
      * + H2,
      * + H3,
      * + H4,
      * + H5,
      * + H6 {
        margin-top: 20px;
      }
    }

    ::v-deep code {
      padding: 0;
      white-space: break-spaces;
      word-break: break-word;
    }

    ::v-deep pre {
      white-space: break-spaces;
      word-break: break-word;
    }

    ::v-deep  > h1:first-of-type {
      display: none;
    }
  }

</style>
