<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Markdown from '@/components/Markdown';
import Loading from '@/components/Loading';
import {
  MODE, _EDIT,
  REPO, REPO_TYPE, CHART, VERSION, _FLAGGED,
} from '@/config/query-params';

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
    console.log('a1');
    await this.$store.dispatch('catalog/load');
    console.log('a2');

    if ( this.$route.query['upgrade'] === _FLAGGED ) {
      console.log('a3');
      const chartName = this.value.spec.chart.metadata.name;
      const versionName = this.value.spec.chart.metadata.version;

      const match = this.$store.getters['catalog/chart']({ chartName });

      const query = { [MODE]: _EDIT };
      const location = this.value.detailLocation;

      location.query = query;

      if ( match ) {
        query[REPO] = match.repoName;
        query[REPO_TYPE] = match.repoType;
        query[CHART] = match.chartName;
        query[VERSION] = versionName;
      }

      console.log('a4', location);
      this.$router.replace(location);
      console.log('a5');
    }
  },

  computed: {
    hasNotes() {
      return !!this.value?.spec?.info?.notes;
    },
    hasReadme() {
      return !!this.value?.spec?.info?.readme;
    }
  },

  watch: { '$route.query': '$fetch' },
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
