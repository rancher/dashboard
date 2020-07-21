<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import ButtonGroup from '@/components/ButtonGroup';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Markdown from '@/components/Markdown';
import { CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { sortBy } from '@/utils/sort';
import { defaultAsyncData } from '@/components/ResourceDetail';
import {
  CLUSTER_REPO, REPO, CHART, VERSION, STEP
} from '@/config/query-params';
import { findBy } from '@/utils/array';
import { addParams } from '@/utils/url';
import YamlEditor from '@/components/YamlEditor';
import Wizard from '@/components/Wizard';
import { CATALOG as CATALOG_ANNOTATIONS } from '@/config/labels-annotations';
import { ensureRegex } from '@/utils/string';

const CERTIFIED_SORTS = {
  [CATALOG_ANNOTATIONS._RANCHER]: 1,
  [CATALOG_ANNOTATIONS._PARTNER]: 2,
  other:                          3,
};

export default {
  name: 'ChartInstall',

  components: {
    BadgeState,
    Banner,
    ButtonGroup,
    Checkbox,
    LabeledSelect,
    Loading,
    Markdown,
    NameNsDescription,
    Wizard,
    YamlEditor,
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    // originalValue: {
    //   type:     Object,
    //   default: null,
    // },
  },

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
      this.chart = findBy(this.allCharts, { [repoKey]: repoName, name: chartName });
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

      allCharts:   null,
      chart:       null,

      versionInfo: null,
      valuesYaml:  null,

      searchQuery:    '',
      sortField:      'certifiedSort',
      showDeprecated: false,
      showRancher:    true,
      showPartner:    true,
      showOther:      true,

      deployed:  false,
      res:       null,
      operation: null,
    };
  },

  computed: {
    steps() {
      return [
        {
          name:  'chart',
          label: 'Select Chart',
          ready: !this.deployed,
        },
        {
          name:  'helm',
          label: 'Helm Options',
          ready: !this.deployed && !!this.chart,
        },
        {
          name:  'values',
          label: 'Chart Options',
          ready: !this.deployed && !!this.versionInfo,
        },
        {
          name:  'deploy',
          label: 'Deploy',
          ready: !!this.versionInfo
        },
      ];
    },

    repos() {
      const clustered = this.clusterRepos || [];
      const namespaced = this.namespacedRepos || [];

      return [...clustered, ...namespaced];
    },

    filteredCharts() {
      return (this.allCharts || []).filter((c) => {
        if ( c.deprecated && !this.showDeprecated ) {
          return false;
        }

        if ( ( c.certified === CATALOG_ANNOTATIONS._RANCHER && !this.showRancher ) ||
             ( c.certified === CATALOG_ANNOTATIONS._PARTNER && !this.showPartner ) ||
             ( c.certified !== CATALOG_ANNOTATIONS._RANCHER && c.certified !== CATALOG_ANNOTATIONS._PARTNER && !this.showOther )
        ) {
          return false;
        }

        if ( this.searchQuery ) {
          const searchTokens = this.searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

          for ( const token of searchTokens ) {
            if ( !c.name.match(token) && !c.description.match(token) ) {
              return false;
            }
          }
        }

        return true;
      });
    },

    arrangedCharts() {
      return sortBy(this.filteredCharts, [this.sortField, 'name']);
    },
  },

  watch: {
    '$route.query':                           '$fetch',
    'operation.metadata.state.transitioning': 'operationChanged',
    'operation.metadata.state.error':         'operationChanged',
    'operation.links.logs':                   'operationChanged',
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

      this.allCharts = sortBy(Object.values(charts), ['key']);

      function addChart(chart, repo) {
        const key = `${ repo.type }/${ repo.metadata.name }/${ chart.name }`;

        let certified = 'other';

        if ( repo.name === 'dev-charts' ) {
          certified = CATALOG_ANNOTATIONS._RANCHER;
        } else if ( repo.name.startsWith('f') ) {
          certified = CATALOG_ANNOTATIONS._PARTNER;
        } else if ( repo.isRancher ) {
          certified = chart.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED] || certified;
        }

        let icon = chart.icon;

        if ( icon ) {
          icon = icon.replace(/^(https?:\/\/github.com\/[^/]+\/[^/]+)\/blob/, '$1/raw');
        }

        let obj = charts[key];

        if ( !obj ) {
          obj = {
            key,
            certified,
            certifiedSort: CERTIFIED_SORTS[certified] || 99,
            icon,
            name:          chart.name,
            description:   chart.description,
            repoName:      repo.name,
            versions:      [],
            deprecated:    !!chart.deprecated,
          };

          if ( repo.type === CATALOG.CLUSTER_REPO ) {
            obj.clusterRepo = repo.metadata.name;
          } else {
            obj.repo = repo.metadata.name;
          }

          charts[key] = obj;
        }

        obj.versions.push(chart);
      }
    },

    selectChart(chart) {
      this.chart = chart;

      this.$router.applyQuery({
        [CLUSTER_REPO]: chart.clusterRepo,
        [CHART]:        chart.name,
        [REPO]:         chart.repo,
        [VERSION]:      chart.versions[0].version,
        [STEP]:         2
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

    async onNext({ step }) {
      if ( step.name === 'deploy' ) {
        this.updateBeforeSave();
        const res = await this.actuallySave();

        this.res = res;

        this.operation = await this.$store.dispatch('cluster/find', {
          type: CATALOG.OPERATION,
          id:   `${ res.operationNamespace }/${ res.operationName }`
        });

        this.deployed = true;
      }
    },

    updateBeforeSave() {
      this.value.chartName = this.chart.name;
      this.value.version = this.$route.query.version;

      // @TODO only save values that differ from defaults?
      this.value.values = jsyaml.safeLoad(this.valuesYaml);
    },

    actuallySave() {
      return this.repo.doAction('install', this.value);
    },

    operationChanged() {
      // eslint-disable-next-line no-console
      console.log('Operation changed');
    },

    focusSearch() {
      this.$refs.searchQuery.focus();
      this.$refs.searchQuery.select();
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Wizard
    v-else
    :steps="steps"
    :show-banner="false"
    @next="onNext($event)"
  >
    <template #chart>
      <div class="clearfix">
        <div class="pull-left">
          <Checkbox v-model="showRancher" label="Rancher" />
          <Checkbox v-model="showPartner" label="Partner" />
          <Checkbox v-model="showOther" label="Other" />
        </div>
        <div class="pull-right">
          <input ref="searchQuery" v-model="searchQuery" type="search" class="input-sm" placeholder="Filter">
          <button v-shortkey.once="['/']" class="hide" @shortkey="focusSearch()" />
        </div>
        <div class="pull-right pt-5 pr-10">
          <ButtonGroup v-model="sortField" :options="[{label: 'By Name', value: 'name'}, {label: 'By Kind', value: 'certifiedSort'}]" />
        </div>
      </div>
      <div class="charts">
        <div v-for="c in arrangedCharts" :key="c.key" class="chart" :class="{[c.certified]: true}" @click="selectChart(c)">
          <div class="logo">
            <img v-if="c.icon" :src="c.icon" />
            <i v-else class="icon icon-file icon-3x" style="position: relative; top: 5px;" />
          </div>
          <h4 class="name">
            {{ c.name }}
          </h4>
          <div class="description">
            {{ c.description }}
          </div>
        </div>
      </div>
    </template>

    <template v-if="chart" #helm>
      <div class="row">
        <div class="col span-12">
          <Markdown v-model="versionInfo.readme" class="readme" />
        </div>
      </div>

      <NameNsDescription
        :mode="mode"
        :value="value"
        :direct="true"
        name-key="releaseName"
        namespace-key="namespace"
        description-key="description"
      />

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            label="Chart Version"
            :value="$route.query.version"
            option-label="version"
            option-key="version"
            :reduce="opt=>opt.version"
            :options="chart.versions"
            @input="selectVersion($event)"
          />
        </div>
      </div>
    </template>

    <template v-if="versionInfo" #values>
      <YamlEditor
        v-if="versionInfo"
        class="yaml-editor"
        :value="valuesYaml"
        @onInput="valuesChanged"
      />
    </template>

    <template v-if="operation" #deploy>
      <BadgeState :value="operation" />
      <Banner
        v-if="operation.showMessage"
        class="state-banner"
        :color="operation.stateColor"
        :label="operation.metadata.state.message"
      />
      <div>
        Logs........
      </div>
    </template>

    <template v-if="!chart" #next>
      &nbsp;
    </template>
  </Wizard>
</template>

<style lang="scss" scoped>
  $margin: 10px;
  $logo: 50px;

  .yaml-editor {
    flex: 1;
    min-height: 400px;
  }

  .charts {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .chart {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .chart {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .chart {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .chart {
        width: calc(25% - 2 * #{$margin});
      }
    }

    .chart {
      height: 110px;
      margin: $margin;
      padding: $margin;
      position: relative;
      border-radius: calc( 3 * var(--border-radius));
      border-left: calc( 3 * var(--border-radius)) solid transparent;

      &:hover {
        box-shadow: 0 0 0 2px var(--body-text);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
      }

      .logo {
        text-align: center;
        position: absolute;
        left: 10px;
        top: 10px;
        width: $logo;
        height: $logo;
        border-radius: 50%;
        overflow: hidden;

        img {
          width: $logo;
          height: $logo;
          object-fit: contain;
        }
      }

      &.rancher {
        background: var(--app-rancher-bg);
        border-left-color: var(--app-rancher-accent);

        .logo {
          background-color: var(--app-rancher-accent);
        }
      }

      &.partner {
        background: var(--app-partner-bg);
        border-left-color: var(--app-partner-accent);

        .logo {
          background-color: var(--app-partner-accent);
        }
      }

      &.other {
        background: var(--app-other-bg);
        border-left-color: var(--app-other-accent);

        .logo {
          background-color: var(--app-other-accent);
        }
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 10px;
        margin-left: $logo+10px;
      }

      .description {
        margin-top: 10px;
        margin-left: $logo+10px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-muted);
      }
    }
  }

  .readme {
    max-height: calc(100vh - 520px);
    margin-bottom: 20px;
    overflow: auto;
  }
</style>
