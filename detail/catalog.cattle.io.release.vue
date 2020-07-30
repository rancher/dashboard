<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Markdown from '@/components/Markdown';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, Tabbed, Tab
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    hasNotes() {
      return !!this.value?.spec?.info?.notes;
    },
    hasReadme() {
      return !!this.value?.spec?.info?.readme;
    }
  }
};
</script>

<template>
  <Tabbed class="mt-20" default-tab="notes">
    <Tab v-if="hasNotes" name="notes" label="Notes">
      <Markdown v-model="value.spec.info.notes" />
    </Tab>
    <Tab v-if="hasReadme" name="readme" label="Readme">
      <Markdown v-model="value.spec.info.readme" />
    </Tab>
    </div>
  </tabbed>
</template>
