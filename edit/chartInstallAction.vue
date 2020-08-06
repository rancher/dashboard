<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import UnitInput from '@/components/form/UnitInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import LazyImage from '@/components/LazyImage';
import Markdown from '@/components/Markdown';
import { CATALOG } from '@/config/types';
import { defaultAsyncData } from '@/components/ResourceDetail';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY,
} from '@/config/query-params';
import CruResource from '@/components/CruResource';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import YamlEditor from '@/components/YamlEditor';
import Checkbox from '@/components/form/Checkbox';
import { DESCRIPTION as DESCRIPTION_ANNOTATION } from '@/config/labels-annotations';
import { exceptionToErrorsArray } from '@/utils/error';
import { diff } from '@/utils/object';
import isEqual from 'lodash/isEqual';
import { clear } from '@/utils/array';

export default {
  name: 'ChartInstall',

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
    this.errors = [];

    const query = this.$route.query;

    await this.$store.dispatch('catalog/load');

    const repoType = query[REPO_TYPE];
    const repoName = query[REPO];
    const chartName = query[CHART];
    const versionName = query[VERSION];

    if ( this.repo && !this.chart && chartName ) {
      this.chart = this.$store.getters['catalog/chart']({
        repoType, repoName, chartName
      });
    }

    if ( !this.chart ) {
      throw new Error('Chart not found');
    }

    if ( this.chart.targetNamespace ) {
      this.forceNamespace = this.chart.targetNamespace;
    } else if ( query[NAMESPACE] ) {
      this.forceNamespace = query[NAMESPACE];
    } else {
      this.forceNamespace = null;
    }

    if ( this.chart.targetName ) {
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

    if ( versionName ) {
      this.version = this.$store.getters['catalog/version']({
        repoType, repoName, chartName, version: versionName
      });

      this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
        repoType, repoName, chartName, version: versionName
      });

      // TODO: Remove
      // This is only in place until logging changes the component annotation to component-ui
      const stopGapComponentKey = 'catalog.cattle.io/component';
      const component = this.version?.annotations?.[CATALOG.COMPONENT] || this.version?.annotations?.[stopGapComponentKey];

      if ( component ) {
        if ( this.$store.getters['catalog/haveComponent'](component) ) {
          this.valuesComponent = this.$store.getters['catalog/importComponent'](component);
        } else {
          this.valuesComponent = null;
        }
      } else {
        this.valuesComponent = null;
      }

      if ( !this.loadedVersion || this.loadedVersion !== this.version.key ) {
        // If the chart/version changes, replace the values with the new one
        this.chartValues = merge({}, this.versionInfo.values);
        this.loadedVersion = this.version.key;
        this.valuesYaml = jsyaml.safeDump(this.chartValues);
      }
    }
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, 'chartInstallAction');
  },

  data() {
    return {
      chart:       null,
      version:     null,
      versionInfo: null,
      valuesYaml:  null,

      forceNamespace: null,
      nameDisabled:   false,

      errors:          null,
      valuesComponent: null,
      chartValues:     null,
      loadedVersion:   null,

      openApi: true,
      hooks:   true,
      crds:    true,
    };
  },

  computed: {
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
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    }
  },

  mounted() {
    window.scrollTop = 0;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
      window.c = this;
    }
  },

  methods: {
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
      this.$router.replace({ name: 'c-cluster-apps' });
    },

    async finish({ btnCb, errors }) {
      try {
        const obj = this.installInput();
        const res = await this.repo.doAction('install', obj);

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
        clear(errors);
        errors.push(...exceptionToErrorsArray(err));
        btnCb(false);
      }
    },

    installInput() {
      const install = JSON.parse(JSON.stringify(this.value));
      const chart = install.charts[0];

      install.disableOpenAPIValidation = this.openApi === false;
      install.noHooks = this.hooks === false;
      install.skipCRDs = this.crds === false;

      chart.chartName = this.chart.chartName;
      chart.version = this.version.version;
      chart.releaseName = install.metadata.name;
      chart.namespace = install.metadata.namespace;
      chart.description = install.metadata?.annotations?.[DESCRIPTION_ANNOTATION];

      delete install.metadata;

      if ( !this.valuesComponent ) {
        const fromYaml = jsyaml.safeLoad(this.valuesYaml);

        this.chartValues = fromYaml;
      }

      const fromChart = this.versionInfo.values || {};

      // Only save the values that differ from the chart's standard values.yaml
      chart.values = diff(fromChart, this.chartValues);

      return install;
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
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :can-create="true"
    :can-yaml="false"
    done-route="c-cluster-apps"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    @finish="finish($event)"
    @cancel="cancel"
  >
    <template #define>
      <div class="row mb-20">
        <div class="col span-3 text-center">
          <LazyImage :src="chart.icon" class="logo" />
        </div>
        <div class="col span-9 description">
          <h2 class="name">
            {{ chart.name }}
          </h2>
          <Markdown v-if="versionInfo && versionInfo.appReadme" v-model="versionInfo.appReadme" class="readme" />
          <p v-else-if="chart.description">
            {{ chart.description }}
          </p>
        </div>
      </div>

      <NameNsDescription
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

      <Tabbed :side-tabs="true" @changed="tabChanged($event)">
        <Tab v-if="showReadme" name="readme" label="Read Me" :weight="1">
          <Markdown v-if="showReadme" ref="readme" v-model="versionInfo.readme" class="readme" />
        </Tab>

        <Tab v-if="valuesComponent" name="values-form" label="Chart Options" :weight="2">
          <component
            :is="valuesComponent"
            v-if="valuesComponent"
            v-model="chartValues"
            :chart="chart"
            :version="version"
            :version-info="versionInfo"
          />
        </Tab>

        <Tab v-else name="values-yaml" label="Values YAML" :weight="2">
          <YamlEditor
            ref="yaml"
            :scrolling="false"
            :value="valuesYaml"
            @onInput="yamlChanged"
          />
        </Tab>

        <Tab name="advanced" label="Advanced" :weight="3">
          <p><Checkbox v-model="openApi" :label="t('catalog.chart.advanced.openapi')" /></p>
          <p><Checkbox v-model="hooks" :label="t('catalog.chart.advanced.hooks')" /></p>
          <p><Checkbox v-model="crds" :label="t('catalog.chart.advanced.crds')" /></p>
          <p style="display: inline-block; width 400px;">
            <UnitInput
              v-model="value.timeout"
              :label="t('catalog.chart.advanced.timeout.label')"
              :suffix="t('catalog.chart.advanced.timeout.unit')"
            />
          </p>
        </Tab>
      </Tabbed>
    </template>
  </cruresource>
</template>

<style lang="scss" scoped>
  $desc-height: 150px;
  $padding: 5px;

  .readme {
    overflow-wrap: break-word;
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

      CODE, PRE {
        overflow-wrap: break-word;
        white-space: initial;
      }
    }
  }

  .logo {
    max-height: $desc-height - 2 * $padding;
    max-width: calc(100% - #{2 * $padding});
    background-color: white;
    border: $padding solid white;
    border-radius: $padding;
  }

  .name {
    margin: #{-1 * $padding} 0 0 0;
  }

  .description {
    min-height: $padding;
  }
</style>
