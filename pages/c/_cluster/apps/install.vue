<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEqual from 'lodash/isEqual';

import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import UnitInput from '@/components/form/UnitInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import LazyImage from '@/components/LazyImage';
import Markdown from '@/components/Markdown';
import CruResource from '@/components/CruResource';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import YamlEditor from '@/components/YamlEditor';
import Checkbox from '@/components/form/Checkbox';
import Questions from '@/components/Questions';

import { CATALOG } from '@/config/types';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, _CREATE, _EDIT,
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, DESCRIPTION as DESCRIPTION_ANNOTATION } from '@/config/labels-annotations';
import { exceptionToErrorsArray } from '@/utils/error';
import { diff } from '@/utils/object';
import { findBy } from '@/utils/array';

export default {
  name: 'Install',

  components: {
    Checkbox,
    UnitInput,
    LabeledSelect,
    LazyImage,
    Loading,
    Markdown,
    NameNsDescription,
    CruResource,
    Tabbed,
    Tab,
    YamlEditor,
    Questions,
  },

  async fetch() {
    this.errors = [];

    const query = this.$route.query;

    await this.$store.dispatch('catalog/load');

    const repoType = query[REPO_TYPE];
    const repoName = query[REPO];
    const chartName = query[CHART];
    let versionName = query[VERSION];
    const releaseNamespace = query[NAMESPACE] || '';
    const releaseName = query[NAME] || '';

    if ( releaseNamespace && releaseName ) {
      this.mode = _EDIT;
      this.existing = await this.$store.dispatch('cluster/find', {
        type: CATALOG.RELEASE,
        id:   `${ releaseNamespace }/${ releaseName }`
      });
    } else {
      this.mode = _CREATE;
    }

    this.value = await this.$store.dispatch('cluster/create', {
      type:     'chartInstallAction',
      metadata: {
        name:      releaseNamespace,
        namespace: releaseName
      }
    });

    if ( this.repo && chartName ) {
      this.chart = this.$store.getters['catalog/chart']({
        repoType, repoName, chartName
      });
    }

    if ( this.chart?.targetNamespace ) {
      this.forceNamespace = this.chart.targetNamespace;
    } else if ( query[NAMESPACE] ) {
      this.forceNamespace = query[NAMESPACE];
    } else {
      this.forceNamespace = null;
    }

    if ( this.chart?.targetName ) {
      this.value.metadata.name = this.chart.targetName;
      this.nameDisabled = true;
    } else if ( query[NAME] ) {
      this.value.metadata.name = query[name];
    } else {
      this.nameDisabled = false;
    }

    if ( query[DESCRIPTION_QUERY] ) {
      this.value.setAnnotation(DESCRIPTION_ANNOTATION, query[DESCRIPTION_QUERY]);
    }

    if ( !versionName && this.chart?.versions?.length ) {
      versionName = this.chart.versions[0].version;
    }

    if ( versionName ) {
      this.version = this.$store.getters['catalog/version']({
        repoType, repoName, chartName, versionName
      });

      try {
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType, repoName, chartName, versionName
        });
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
        throw e;
      }

      if ( this.version && process.client ) {
        await this.loadValuesComponent();
      }

      if ( this.existing ) {
        if ( !this.chartValues ) {
          this.chartValues = merge({}, this.existing.spec?.values || {});
          this.loadedVersion = this.version.key;
          this.valuesYaml = jsyaml.safeDump(this.chartValues);
        }
      } else if ( !this.loadedVersion || this.loadedVersion !== this.version.key ) {
        // If the chart/version changes, replace the values with the new one
        this.chartValues = merge({}, this.versionInfo.values);
        this.loadedVersion = this.version.key;
        this.valuesYaml = jsyaml.safeDump(this.chartValues);
      }
    }
  },

  data() {
    return {
      mode:        null,
      value:       null,
      existing:    null,
      chart:       null,
      version:     null,
      versionInfo: null,
      valuesYaml:  null,

      forceNamespace: null,
      nameDisabled:   false,

      errors:          null,
      valuesComponent: null,
      valuesTabs:      false,
      chartValues:     null,
      loadedVersion:   null,

      openApi:       true,
      hooks:         true,
      crds:          true,
      wait:          true,
      historyMax:    5,
      timeout:       0,
      atomic:        false,
      cleanupOnFail: false,
      dryRun:        false,
      force:         false,
      resetValues:   false,
      reuseValues:   false,
    };
  },

  computed: {
    charts() {
      return this.$store.getters['catalog/charts'].filter(x => !x.deprecated);
    },

    repo() {
      const query = this.$route.query;
      const repoType = query[REPO_TYPE];
      const repoName = query[REPO];

      return this.$store.getters['catalog/repo']({ repoType, repoName });
    },

    showReadme() {
      return !!this.versionInfo?.readme;
    },

    showNameEditor() {
      return !this.nameDisabled || !this.forceNamespace;
    },

    showVersions() {
      return this.chart?.versions.length > 1;
    },

    targetNamespace() {
      if ( this.forceNamespace ) {
        return this.forceNamespace;
      } else if ( this.value?.metadata.namespace ) {
        return this.value.metadata.namespace;
      }

      return 'default';
    }
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    },
  },

  mounted() {
    window.scrollTop = 0;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
      window.c = this;
    }
  },

  created() {
    this.loadValuesComponent();
  },

  methods: {
    async loadValuesComponent() {
      const component = this.version?.annotations?.[CATALOG_ANNOTATIONS.COMPONENT];

      if ( component ) {
        if ( this.$store.getters['catalog/haveComponent'](component) ) {
          this.valuesComponent = this.$store.getters['catalog/importComponent'](component);

          const loaded = await this.valuesComponent();

          this.valuesTabs = loaded?.default?.hasTabs || false;
        } else {
          this.valuesComponent = null;
          this.valuesTabs = false;
        }
      } else {
        this.valuesComponent = null;
        this.valuesTabs = false;
      }
    },

    selectChart(key, version) {
      const chart = findBy(this.charts, 'key', key);

      this.$router.applyQuery({
        [REPO]:      chart.repoName,
        [REPO_TYPE]: chart.repoType,
        [CHART]:     chart.chartName,
        [VERSION]:   version || chart.versions[0].version
      });
    },

    selectVersion(version) {
      this.$router.applyQuery({ [VERSION]: version });
    },

    yamlChanged(str) {
      try {
        jsyaml.safeLoad(str);

        this.valuesYaml = str;
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },

    cancel() {
      if ( this.existing ) {
        this.done();
      } else {
        this.$router.replace({ name: 'c-cluster-apps' });
      }
    },

    done() {
      this.$router.replace({
        name:   `c-cluster-product-resource`,
        params: {
          product:   this.$store.getters['productId'],
          cluster:   this.$store.getters['clusterId'],
          resource:  CATALOG.RELEASE,
        }
      });
    },

    async finish(btnCb) {
      try {
        let res;

        this.errors = [];

        if ( this.existing ) {
          const upgrade = this.upgradeInput();

          res = await this.repo.doAction('upgrade', upgrade);
        } else {
          const install = this.installInput();

          res = await this.repo.doAction('install', install);
        }

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
        this.done();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
    },

    installInput() {
      const install = JSON.parse(JSON.stringify(this.value));

      install.disableOpenAPIValidation = this.openApi === false;
      install.noHooks = this.hooks === false;
      install.skipCRDs = this.crds === false;
      install.timeout = this.timeout > 0 ? this.timeout : null;
      install.wait = this.wait === true;

      const chart = {
        chartName:   this.chart.chartName,
        version:     this.version.version,
        releaseName: install.metadata.name,
        namespace:   install.metadata.namespace,
        description: install.metadata?.annotations?.[DESCRIPTION_ANNOTATION],
      };

      delete install.metadata;

      if ( !this.valuesComponent ) {
        const fromYaml = jsyaml.safeLoad(this.valuesYaml);

        this.chartValues = fromYaml;
      }

      const fromChart = this.versionInfo.values || {};

      // Only save the values that differ from the chart's standard values.yaml
      chart.values = diff(fromChart, this.chartValues);

      install.charts = [];

      const auto = (this.version.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL] || '').split(/\s*,\s*/).filter(x => !!x);

      for ( const gvr of auto ) {
        const provider = this.$store.getters['catalog/versionProviding']({
          gvr,
          repoName: this.chart.repoName,
          repoType: this.chart.repoType
        });

        if ( provider ) {
          install.charts.unshift({
            chartName:   provider.name,
            version:     provider.version,
            releaseName: provider.annotations[CATALOG_ANNOTATIONS.RELEASE_NAME] || provider.name,
            namespace:   provider.annotations[CATALOG_ANNOTATIONS.NAMESPACE] || chart.namespace,
          });
        }
      }

      install.charts.push(chart);

      return install;
    },

    upgradeInput() {
      const upgrade = {
        namespace:   this.existing.spec.namespace,
        releaseName: this.existing.spec.name,

        chartName: this.chart.chartName,
        version:   this.version.version,

        atomic:        this.atomic,
        cleanupOnFail: this.cleanupOnFail,
        dryRun:        this.dryRun,
        force:         this.force,
        hooks:         this.hooks,
        resetValues:   this.resetValues,
        reuseValues:   this.reuseValues,
        wait:          this.wait,
        historyMax:    this.historyMax > 0 ? this.historyMax : null,
        timeout:       this.timeout,
      };

      if ( !this.valuesComponent ) {
        const fromYaml = jsyaml.safeLoad(this.valuesYaml);

        this.chartValues = fromYaml;
      }

      const fromChart = this.versionInfo.values || {};

      // Only save the values that differ from the chart's standard values.yaml
      upgrade.values = diff(fromChart, this.chartValues);

      return upgrade;
    },

    tabChanged({ tab }) {
      window.scrollTop = 0;

      if ( tab.name === 'values-yaml' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },
  }
};
</script>

<template>
  <div>
    <h1 v-if="existing">
      <t k="catalog.install.header.upgrade" :name="existing.nameDisplay" />
    </h1>
    <h1 v-else-if="chart">
      <t k="catalog.install.header.install" :name="chart.chartName" />
    </h1>
    <h1 v-else>
      <t k="catalog.install.header.installGeneric" />
    </h1>

    <Loading v-if="$fetchState.pending" />
    <CruResource
      v-else
      :can-create="true"
      :can-yaml="false"
      done-route="c-cluster-apps"
      :mode="mode"
      :resource="value"
      :subtypes="[]"
      :finish-button-mode="(existing ? 'upgrade' : 'install')"
      :errors="errors"
      :cancel-event="true"
      @error="e=>errors = e"
      @finish="finish($event)"
      @cancel="cancel"
    >
      <template #define>
        <div v-if="chart" class="chart-info mb-20">
          <div class="logo-container">
            <div class="logo-bg">
              <LazyImage :src="chart.icon" class="logo" />
            </div>
          </div>
          <div class="description">
            <Markdown v-if="versionInfo && versionInfo.appReadme" v-model="versionInfo.appReadme" class="md md-desc" />
            <p v-else-if="chart.description">
              {{ chart.description }}
            </p>
          </div>
        </div>

        <div v-if="existing && chart" class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              label="Chart"
              :value="$route.query.chart"
              option-label="chartName"
              option-key="key"
              :reduce="opt=>opt.key"
              :options="charts"
              @input="selectChart($event)"
            />
          </div>
          <div v-if="chart" class="col span-6">
            <LabeledSelect
              label="Version"
              :value="$route.query.version"
              option-label="version"
              option-key="version"
              :reduce="opt=>opt.version"
              :options="chart.versions"
              @input="selectVersion($event)"
            />
          </div>
        </div>
        <NameNsDescription
          v-else
          v-show="showNameEditor"
          v-model="value"
          :mode="mode"
          :name-disabled="nameDisabled"
          :force-namespace="forceNamespace"
          :extra-columns="showVersions ? ['versions'] : []"
        >
          <template v-if="showVersions" #versions>
            <LabeledSelect
              label="Chart Version"
              :value="$route.query.version"
              option-label="version"
              option-key="version"
              :reduce="opt=>opt.version"
              :options="chart.versions"
              @input="selectVersion($event)"
            />
          </template>
        </NameNsDescription>

        <Tabbed
          :side-tabs="true"
          :class="{'with-name': showNameEditor}"
          @changed="tabChanged($event)"
        >
          <Tab v-if="showReadme" name="readme" :label="t('catalog.install.section.readme')" :weight="-1">
            <!-- Negative weight makes it go before any valuesComponent tabs with no weight set -->
            <Markdown v-if="showReadme" ref="readme" v-model="versionInfo.readme" class="md readme" />
          </Tab>

          <template v-if="valuesComponent">
            <component
              :is="valuesComponent"
              v-if="valuesTabs"
              v-model="chartValues"
              :chart="chart"
              :version="version"
              :version-info="versionInfo"
            />
            <Tab
              v-else
              name="values-form"
              :label="t('catalog.install.section.chartOptions')"
            >
              <component
                :is="valuesComponent"
                v-if="valuesComponent"
                v-model="chartValues"
                :chart="chart"
                :version="version"
                :version-info="versionInfo"
              />
            </Tab>
          </template>
          <Questions
            v-else-if="versionInfo && versionInfo.questions"
            v-model="chartValues"
            :chart="chart"
            :version="version"
            :version-info="versionInfo"
            :target-namespace="targetNamespace"
          />
          <Tab v-else name="values-yaml" :label="t('catalog.install.section.valuesYaml')">
            <YamlEditor
              ref="yaml"
              :scrolling="false"
              :value="valuesYaml"
              @onInput="yamlChanged"
            />
          </Tab>

          <Tab name="helm" :label="t('catalog.install.section.helm')" :weight="100">
            <div v-if="existing">
              <div><Checkbox v-model="atomic" :label="t('catalog.install.helm.atomic')" /></div>
              <div><Checkbox v-model="cleanupOnFail" :label="t('catalog.install.helm.cleanupOnFail')" /></div>
              <div><Checkbox v-model="dryRun" :label="t('catalog.install.helm.dryRun')" /></div>
              <div><Checkbox v-model="force" :label="t('catalog.install.helm.force')" /></div>
              <div><Checkbox v-model="hooks" :label="t('catalog.install.helm.hooks')" /></div>
              <div><Checkbox v-model="resetValues" :label="t('catalog.install.helm.resetValues')" /></div>
              <div><Checkbox v-model="reuseValues" :label="t('catalog.install.helm.reuseValues')" /></div>
              <div><Checkbox v-model="wait" :label="t('catalog.install.helm.wait')" /></div>
              <div style="display: inline-block; max-width: 400px;">
                <UnitInput
                  v-model.number="historyMax"
                  :label="t('catalog.install.helm.historyMax.label')"
                  :suffix="t('catalog.install.helm.historyMax.unit')"
                />
              </div>
              <div style="display: inline-block; max-width: 400px;">
                <UnitInput
                  v-model.number="timeout"
                  :label="t('catalog.install.helm.timeout.label')"
                  :suffix="t('catalog.install.helm.timeout.unit')"
                />
              </div>
            </div>
            <div v-else>
              <div><Checkbox v-model="openApi" :label="t('catalog.install.helm.openapi')" /></div>
              <div><Checkbox v-model="hooks" :label="t('catalog.install.helm.hooks')" /></div>
              <div><Checkbox v-model="crds" :label="t('catalog.install.helm.crds')" /></div>
              <div><Checkbox v-model="wait" :label="t('catalog.install.helm.wait')" /></div>
              <div style="display: inline-block; max-width: 400px;">
                <UnitInput
                  v-model.number="timeout"
                  :label="t('catalog.install.helm.timeout.label')"
                  :suffix="t('catalog.install.helm.timeout.unit')"
                />
              </div>
            </div>
          </Tab>
        </Tabbed>
      </template>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
  $desc-height: 150px;
  $padding: 5px;

  ::v-deep .tab-container {
    min-height: calc(100vh - 425px); // @TODO caculate from variables
    max-height: calc(100vh - 425px); // @TODO caculate from variables
    overflow: auto;
  }

  ::v-deep .with-name .tab-container {
    min-height: calc(100vh - 500px); // @TODO caculate from variables
    max-height: calc(100vh - 500px); // @TODO caculate from variables
  }

  .md {
    overflow: auto;
    max-width: 100%;

    ::v-deep {
      * + H1,
      * + H2,
      * + H3,
      * + H4,
      * + H5,
      * + H6 {
        margin-top: 20px;
      }
    }
  }

  .md-desc > H1:first-child {
    display: none;
  }

  .chart-info {
    margin-top: 10px;
    display: flex;
    height: $desc-height;

    .logo-container {
      height: $desc-height;
      width: $sideways-tabs-width;
      text-align: center;
    }

    .logo-bg {
      height: $desc-height;
      width: $desc-height;
      background-color: white;
      border: $padding solid white;
      border-radius: calc( 3 * var(--border-radius));
      margin: 0 auto;
      position: relative;
    }

    .logo {
      max-height: $desc-height - 2 * $padding;
      max-width: $desc-height - 2 * $padding;
      position: absolute;
      width: auto;
      height: auto;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      margin: auto;
    }

    .description {
      flex-grow: 1;
      padding-left: 20px;
      width: calc(100% - #{$sideways-tabs-width});
      height: $desc-height;
      overflow: auto;

      .name {
        margin: #{-1 * $padding} 0 0 0;
      }
    }
  }
</style>
