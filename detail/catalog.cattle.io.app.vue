<script>
import YamlEditor from '@/components/YamlEditor';
import Loading from '@/components/Loading';
import Markdown from '@/components/Markdown';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import RelatedResources from '@/components/RelatedResources';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, Tabbed, Tab, Loading, YamlEditor, RelatedResources
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');
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

      return jsyaml.safeDump(combined);
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
  <Tabbed v-else class="mt-20" default-tab="resources" @changed="tabChanged($event)">
    <Tab name="resources" :label="t('catalog.app.section.resources')" :weight="4">
      <RelatedResources :value="value" rel="helmresource" />
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
</template>
