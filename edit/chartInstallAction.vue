<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import LabeledSelect from '@/components/form/LabeledSelect';
import { CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { sortBy } from '@/utils/sort';
import { defaultAsyncData } from '@/components/ResourceDetail';

export default {
  name: 'EditRelease',

  components: {
    NameNsDescription,
    LabeledSelect,
    Loading,
    Footer,
  },

  mixins: [CreateEditView],

  async fetch() {
    let promises = {
      clusterRepos: this.$store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO }),
      repos:        this.$store.dispatch('cluster/findAll', { type: CATALOG.REPO }),
    };

    if ( this.value.id ) {
      // @TODO load something for edit...
    }

    const hash = await allHash(promises);

    this.repos = [...hash.clusterRepos, ...hash.repos];

    promises = [];
    for ( const repo of this.repos ) {
      promises.push(repo.followLink('index'));
    }

    const indexes = await Promise.all(promises);
    const charts = {};

    for ( let i = 0 ; i < indexes.length ; i++ ) {
      const obj = indexes[i];
      const repo = this.repos[i];

      for ( const k in obj.entries ) {
        for ( const entry of obj.entries[k] ) {
          addChart(entry, repo);
        }
      }
    }

    this.charts = sortBy(Object.values(charts), ['repo.name', 'name']);

    function addChart(chart, repo) {
      const existing = charts[chart.name];

      if ( existing ) {
        existing.versions.push(chart);
      } else {
        charts[chart.name] = {
          name:     chart.name,
          repo,
          versions: [chart],
        };
      }
    }
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, 'chartInstallAction');
  },

  data() {
    return {
      repos:   null,
      charts:  [],
      chart:   null,
      version: null,
    };
  },

  methods: {
    selectChart(chart) {
      this.chart = chart;
      this.value.chartName = chart.name;
      this.value.version = chart.versions[0].version;
    },

    async actuallySave() {
      if ( this.isCreate ) {
        await this.chart.repo.doAction('install', this.value);
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else-if="chart">
    <div class="mb-20">
      {{ value.chartName }}

      <LabeledSelect
        v-model="value.version"
        option-label="version"
        option-key="version"
        :reduce="opt=>opt.version"
        :options="chart.versions"
      />
    </div>

    <NameNsDescription
      :mode="mode"
      :value="value"
      :direct="true"
      name-key="releaseName"
      namespace-key="namespace"
      description-key="description"
    />

    <div class="spacer"></div>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
  <div v-else>
    <div v-for="c in charts" :key="c.name">
      <a @click="selectChart(c)">{{ c.repo.name }}/{{ c.name }} ({{ c.versions.length }})
      </a>
    </div>
  </div>
</template>
