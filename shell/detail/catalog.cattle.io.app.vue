<script>
import YamlEditor from '@shell/components/YamlEditor';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import Banner from '@shell/components/Banner';
import RelatedResources from '@shell/components/RelatedResources';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { CATALOG } from '@shell/config/types';
import { sortBy } from '~shell/utils/sort';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, Tabbed, Tab, Loading, YamlEditor, Banner, RelatedResources
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return { allOperations: [] };
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    this.allOperations = await this.$store.dispatch('cluster/findAll', { type: CATALOG.OPERATION });
  },

  computed: {
    hasNotes() {
      return !!this.value?.spec?.info?.notes;
    },

    hasReadme() {
      return !!this.value?.spec?.info?.readme;
    },

    valuesYaml() {
      const combined = merge(merge({}, this.value?.spec?.chart?.values || {}), this.value?.spec?.values || {});

      return jsyaml.dump(combined);
    },

    isBusy() {
      if (this.value?.metadata?.state?.transitioning && this.value?.metadata?.state?.name === 'pending-install') {
        return true;
      }

      return false;
    },

    filteredOperations() {
      return this.allOperations.filter((operation) => {
        if (operation.status?.releaseName === this.value.metadata.name &&
            operation.status?.namespace === this.value.metadata.namespace) {
          return true;
        }
      });
    },

    latestOperation() {
      if (this.filteredOperations.length > 0) {
        const sortedOperations = sortBy(Object.values(this.filteredOperations), ['createdAt', 'created', 'metadata.creationTimestamp'], true);

        return sortedOperations[0];
      }

      return false;
    },

  },

  methods: {
    tabChanged({ tab }) {
      window.scrollTop = 0;

      this.selectedTabName = tab.name;

      if ( tab.name === 'values-yaml' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <span v-if="latestOperation" class="latest-operation">
      {{ t('catalog.app.section.lastOperation') }}: ( {{ latestOperation.status.action }} ) - <a @click="latestOperation.openLogs()">  {{ t('catalog.app.section.openLogs') }}</a>
    </span>

    <Tabbed class="mt-20" default-tab="resources" @changed="tabChanged($event)">
      <Tab name="resources" :label="t('catalog.app.section.resources.label')" :weight="4">
        <Banner v-if="isBusy" color="info" :label="t('catalog.app.section.resources.busy', { app: value.metadata.name })" />
        <RelatedResources v-else :value="value" rel="helmresource" />
      </Tab>
      <Tab name="values-yaml" :label="t('catalog.app.section.values')" :weight="3">
        <YamlEditor
          ref="yaml"
          :scrolling="false"
          :value="valuesYaml"
          editor-mode="VIEW_CODE"
        />
      </Tab>
      <Tab v-if="hasReadme" name="readme" :label="t('catalog.app.section.readme')" :weight="2">
        <Markdown v-model="value.spec.info.readme" />
      </Tab>
      <Tab v-if="hasNotes" name="notes" :label="t('catalog.app.section.notes')" :weight="1">
        <Markdown v-model="value.spec.info.notes" />
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang="scss" scoped>
.latest-operation a {
  cursor: pointer;
}
</style>
