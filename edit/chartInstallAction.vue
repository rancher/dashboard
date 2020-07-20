<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import LabeledSelect from '@/components/form/LabeledSelect';
import { CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { sortBy } from '@/utils/sort';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { CLUSTER_REPO, REPO, CHART, VERSION } from '@/config/query-params';
import { findBy } from '@/utils/array';
import { addParams } from '@/utils/url';
import YamlEditor from '@/components/YamlEditor';

export default {
  name: 'EditRelease',

  components: {
    NameNsDescription,
    LabeledSelect,
    YamlEditor,
    Loading,
    Footer,
  },

  mixins: [CreateEditView],

  async fetch() {
    const query = this.$route.query;

    if ( !this.clusterRepos ) {
      await this.loadReposAndCharts();
    }

    let repoKey;
    let repoName;
    let repoType;

    if ( query[CLUSTER_REPO] ) {
      repoKey = CLUSTER_REPO;
      repoName = query[CLUSTER_REPO];
      repoType = CATALOG.CLUSTER_REPO;
    } else if ( query[REPO] ) {
      repoKey = REPO;
      repoName = query[REPO];
      repoType = CATALOG.REPO;
    }

    this.repo = findBy(this.repos, { type: repoType, 'metadata.name': repoName });

    const chartName = query[CHART];
    const versionName = query[VERSION];

    if ( this.repo && chartName ) {
      this.chart = findBy(this.charts, { [repoKey]: repoName, name: chartName });
    }

    let version;

    if ( this.chart && versionName ) {
      version = findBy(this.chart.versions, 'version', versionName);
    }

    if ( version ) {
      this.versionInfo = await this.repo.followLink('info', { url: addParams(this.repo.links.info, { chartName, version: versionName }) });
      this.mergeValues(this.versionInfo.values);
      this.valuesYaml = jsyaml.safeDump(this.value.values);
    }
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, 'chartInstallAction');
  },

  data() {
    return {
      clusterRepos:    null,
      namespacedRepos: null,

      charts:      null,
      chart:       null,

      versionInfo: null,
      valuesYaml:  null,
    };
  },

  computed: {
    repos() {
      const clustered = this.clusterRepos || [];
      const namespaced = this.namespacedRepos || [];

      return [...clustered, ...namespaced];
    }
  },

  watch: { '$route.query': '$fetch' },

  created() {
    this.registerBeforeHook(this.updateBeforeSave);
  },

  methods: {
    async loadReposAndCharts() {
      let promises = {
        clusterRepos:    this.$store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO }),
        namespacedRepos: this.$store.dispatch('cluster/findAll', { type: CATALOG.REPO }),
      };

      const hash = await allHash(promises);

      this.clusterRepos = hash.clusterRepos;
      this.namespacedRepos = hash.namespacedRepos;

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

      this.charts = sortBy(Object.values(charts), ['key']);

      function addChart(chart, repo) {
        const key = `${ repo.type }/${ repo.metadata.name }/${ chart.name }`;

        const existing = charts[key];

        if ( existing ) {
          existing.versions.push(chart);
        } else {
          const obj = {
            key,
            name:     chart.name,
            versions: [chart],
          };

          if ( repo.type === CATALOG.CLUSTER_REPO ) {
            obj.clusterRepo = repo.metadata.name;
          } else {
            obj.repo = repo.metadata.name;
          }

          charts[key] = obj;
        }
      }
    },

    selectChart(chart) {
      this.chart = chart;

      this.$router.applyQuery({
        [CLUSTER_REPO]: chart.clusterRepo,
        [CHART]:        chart.name,
        [REPO]:         chart.repo,
        [VERSION]:      chart.versions[0].version,
      });
    },

    selectVersion(version) {
      this.$router.applyQuery({ [VERSION]: version });
    },

    mergeValues(neu) {
      this.value.values = merge({}, neu, this.value.values || {});
    },

    valuesChanged(value) {
      try {
        jsyaml.safeLoad(value);

        this.valuesYaml = value;
      } catch (e) {
      }
    },

    updateBeforeSave() {
      this.value.chartName = this.chart.name;
      this.value.version = this.$route.query.version;

      // @TODO only save values that differ from defaults?
      this.value.values = jsyaml.safeLoad(this.valuesYaml);
    },

    async actuallySave() {
      if ( this.isCreate ) {
        await this.repo.doAction('install', this.value);
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else-if="chart">
    <div class="mb-20">
      {{ chart.name }}

      <LabeledSelect
        :value="$route.query.version"
        option-label="version"
        option-key="version"
        :reduce="opt=>opt.version"
        :options="chart.versions"
        @input="selectVersion($event)"
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

    <YamlEditor
      v-if="versionInfo"
      class="yaml-editor"
      :value="valuesYaml"
      @onInput="valuesChanged"
    />

    <div class="spacer"></div>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
  <div v-else>
    <div v-for="c in charts" :key="c.key">
      <a @click="selectChart(c)">{{ c.key.substr(c.key.indexOf('/')+1) }} ({{ c.versions.length }})
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .yaml-editor {
    flex: 1;
    min-height: 400px;
  }
</style>
