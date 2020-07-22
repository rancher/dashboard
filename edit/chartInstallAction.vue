<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import ButtonGroup from '@/components/ButtonGroup';
import Checkbox from '@/components/form/Checkbox';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import LazyImage from '@/components/LazyImage';
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
import { exceptionToErrorsArray } from '@/utils/error';

const CERTIFIED_SORTS = {
  [CATALOG_ANNOTATIONS._RANCHER]:      1,
  [CATALOG_ANNOTATIONS._EXPERIMENTAL]: 1,
  [CATALOG_ANNOTATIONS._PARTNER]:      2,
  other:                               3,
};

export default {
  name: 'ChartInstall',

  components: {
    ButtonGroup,
    Checkbox,
    LabeledSelect,
    LazyImage,
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

      if ( this.chart.targetNamespace ) {
        this.namespace = this.chart.targetNamespace;
        this.namespaceDisabled = true;
      } else {
        this.namespaceDisabled = false;
      }

      if ( this.chart.targetName ) {
        this.releaseName = this.chart.targetName;
        this.nameDisabled = true;
      } else {
        this.nameDisabled = false;
      }
    }

    let version;

    if ( this.chart && versionName ) {
      version = findBy(this.chart.versions, 'version', versionName);
    }

    if ( version && !this.versionInfo ) {
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

      releaseName:       null,
      namespace:         null,
      description:       null,
      nameDisabled:      false,
      namespaceDisabled: false,

      searchQuery:    '',
      sortField:      'certifiedSort',
      showDeprecated: false,
      showRancher:    true,
      showPartner:    true,
      showOther:      true,

      errors: null,
    };
  },

  computed: {
    steps() {
      return [
        {
          name:  'chart',
          label: 'Select Chart',
        },
        {
          name:  'helm',
          label: 'Helm Options',
          ready: !!this.chart,
        },
        {
          name:  'values',
          label: 'Chart Options',
          ready: !!this.versionInfo,
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

  watch: { '$route.query': '$fetch' },

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
        const certifiedAnnotation = chart.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED];

        let certified = CATALOG_ANNOTATIONS._OTHER;
        let sideLabel = null;

        // @TODO remove fake hackery
        if ( repo.name === 'dev-charts' ) {
          certified = CATALOG_ANNOTATIONS._RANCHER;
        } else if ( chart.name.startsWith('f') ) {
          certified = CATALOG_ANNOTATIONS._PARTNER;
        } else if ( repo.isRancher ) {
          // Only charts from a rancher repo can actually set the certified flag
          certified = certifiedAnnotation || certified;
        }

        // @TODO remove fake hackery
        if ( chart.name.includes('b') ) {
          sideLabel = 'Experimental';
        } else if ( chart.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] ) {
          sideLabel = 'Experimental';
        } else if ( !repo.isRancher && certifiedAnnotation && certified === CATALOG_ANNOTATIONS._OTHER) {
          // But anybody can set the side label
          sideLabel = certifiedAnnotation;
        }

        let icon = chart.icon;

        if ( icon ) {
          icon = icon.replace(/^(https?:\/\/github.com\/[^/]+\/[^/]+)\/blob/, '$1/raw');
        }

        let obj = charts[key];

        if ( !obj ) {
          obj = {
            key,
            icon,
            certified,
            sideLabel,
            certifiedSort:   CERTIFIED_SORTS[certified] || 99,
            name:            chart.name,
            description:     chart.description,
            repoName:        repo.name,
            versions:        [],
            deprecated:      !!chart.deprecated,
            targetNamespace: chart.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE],
            targetName:      chart.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME],
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

    async finish(btnCb) {
      try {
        this.errors = null;
        this.updateBeforeSave();
        const res = await this.repo.doAction('install', this.value);

        this.operation = await this.$store.dispatch('cluster/find', {
          type: CATALOG.OPERATION,
          id:   `${ res.operationNamespace }/${ res.operationName }`
        });

        try {
          await this.operation.waitForLink('logs');
          this.operation.openLogs();
        } catch (e) {
          // The wait times out eventually, move on...
        }

        btnCb(true);

        this.$router.replace({
          name:   `c-cluster-product-resource`,
          params: {
            product:   this.$store.getters['productId'],
            cluster:   this.$store.getters['clusterId'],
            resource:  CATALOG.RELEASE,
          }
        });
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
    },

    updateBeforeSave() {
      this.value.chartName = this.chart.name;
      this.value.version = this.$route.query.version;
      this.value.releaseName = this.releaseName;
      this.value.namespace = this.namespace;
      this.value.description = this.description;

      // @TODO only save values that differ from defaults?
      this.value.values = jsyaml.safeLoad(this.valuesYaml);
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
    :errors="errors"
    @finish="finish($event)"
  >
    <template #chart>
      <div class="clearfix">
        <div class="pull-left">
          <Checkbox v-model="showRancher" label="Rancher" class="check-rancher" />
          <Checkbox v-model="showPartner" label="Partner" class="check-partner" />
          <Checkbox v-model="showOther" label="Other" class="check-other" />
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
          <div class="side-label">
            <label v-if="c.sideLabel">{{ c.sideLabel }}</label>
          </div>
          <div class="logo">
            <LazyImage :src="c.icon" />
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
      <div v-if="versionInfo.readme" class="row">
        <div class="col span-12">
          <Markdown v-model="versionInfo.readme" class="readme" />
        </div>
      </div>

      <NameNsDescription
        v-model="_data"
        :mode="mode"
        :direct="true"
        name-key="releaseName"
        namespace-key="namespace"
        description-key="description"
        :name-disabled="nameDisabled"
        :namespace-disabled="namespaceDisabled"
        :allow-new-namespace="true"
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
  </Wizard>
</template>

<style lang="scss" scoped>
  $chart: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

  .yaml-editor {
    flex: 1;
    min-height: 400px;
  }

  .check-rancher, .check-partner, .check-other {
    border-radius: var(--border-radius);
    padding: 3px 0 3px 8px;
    margin-right: 5px;
  }
  .check-rancher {
    background: var(--app-rancher-bg);
    border: 1px solid var(--app-rancher-accent);
  }
  .check-partner {
    background: var(--app-partner-bg);
    border: 1px solid var(--app-partner-accent);
  }
  .check-other {
    background: var(--app-other-bg);
    border: 1px solid var(--app-other-accent);
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
      height: $chart;
      margin: $margin;
      padding: $margin;
      position: relative;
      border-radius: calc( 3 * var(--border-radius));

      &:hover {
        box-shadow: 0 0 0 2px var(--body-text);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
      }

      .side-label {
        transform: rotate(180deg);
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        min-width: calc(3 * var(--border-radius));
        width: $side;
        border-top-right-radius: calc( 3 * var(--border-radius));
        border-bottom-right-radius: calc( 3 * var(--border-radius));

        label {
          text-align: center;
          writing-mode: tb;
          height: 100%;
          padding: 0 1px;
          display: block;
          white-space: no-wrap;
          text-overflow: ellipsis;
        }
      }

      .logo {
        text-align: center;
        position: absolute;
        left: $side+$margin;
        top: ($chart - $logo)/2;
        width: $logo;
        height: $logo;
        border-radius: calc(5 * var(--border-radius));
        overflow: hidden;

        img {
          width: $logo - 4px;
          height: $logo - 4px;
          object-fit: contain;
          position: relative;
          top: 2px;
        }
      }

      &.rancher {
        background: var(--app-rancher-bg);

        .logo { background-color: var(--app-rancher-accent); }
        .side-label { background-color: var(--app-rancher-accent); color: var(--app-rancher-accent-text); }
      }

      &.partner {
        background: var(--app-partner-bg);

        .logo { background-color: var(--app-partner-accent); }
        .side-label { background-color: var(--app-partner-accent); color: var(--app-partner-accent-text); }
      }

      &.other {
        background: var(--app-other-bg);

        .logo { background-color: white; }
        .side-label { background-color: var(--app-other-accent); color: var(--app-other-accent-text); }
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: $margin;
        margin-left: $side+$logo+$margin;
      }

      .description {
        margin-top: $margin;
        margin-left: $side+$logo+$margin;
        margin-right: $margin;
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
