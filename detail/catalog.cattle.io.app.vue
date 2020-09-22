<script>
import YamlEditor from '@/components/YamlEditor';
import Loading from '@/components/Loading';
import Markdown from '@/components/Markdown';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import jsyaml from 'js-yaml';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, Tabbed, Tab, Loading, YamlEditor
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
      return jsyaml.safeDump(this.value?.spec?.chart?.values || {});
    }
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
  <Tabbed v-else class="mt-20" default-tab="notes" @changed="tabChanged($event)">
    <Tab v-if="hasNotes" name="notes" :label="t('catalog.app.section.notes')" :weight="1">
      <Markdown v-model="value.spec.info.notes" />
    </Tab>
    <Tab v-if="hasReadme" name="readme" :label="t('catalog.app.section.readme')" :weight="2">
      <Markdown v-model="value.spec.info.readme" />
    </Tab>
    <Tab name="values-yaml" :label="t('catalog.app.section.values')" :weight="3">
      <YamlEditor
        ref="yaml"
        :scrolling="false"
        :value="valuesYaml"
        editor-mode="VIEW_CODE"
      />
    </Tab>
  </Tabbed>
</template>
