<script>
import Loading from '@/components/Loading';
import Markdown from '@/components/Markdown';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, Tabbed, Tab, Loading
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
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Tabbed v-else class="mt-20" default-tab="notes">
    <Tab v-if="hasNotes" name="notes" label="Notes">
      <Markdown v-model="value.spec.info.notes" />
    </Tab>
    <Tab v-if="hasReadme" name="readme" label="Readme">
      <Markdown v-model="value.spec.info.readme" />
    </Tab>
  </Tabbed>
</template>
