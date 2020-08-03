<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Markdown from '@/components/Markdown';
import { CATALOG } from '@/config/types';
import { defaultAsyncData } from '@/components/ResourceDetail';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME, DESCRIPTION as DESCRIPTION_QUERY, STEP
} from '@/config/query-params';
import Wizard from '@/components/Wizard';
import YamlEditor from '@/components/YamlEditor';
import { DESCRIPTION as DESCRIPTION_ANNOTATION } from '@/config/labels-annotations';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  name: 'ChartInstall',

  components: {
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

    await this.$store.dispatch('catalog/load');

    const repoType = query[REPO_TYPE];
    const repoName = query[REPO];

    this.repo = this.$store.getters['catalog/repo']({ repoType, repoName });

    const chartName = query[CHART];
    const version = query[VERSION];

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

    if ( version ) {
      this.version = this.$store.getters['catalog/version']({
        repoType, repoName, chartName, version
      });

      this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
        repoType, repoName, chartName, version
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

      if ( !this.value.values ) {
        this.mergeValues(this.versionInfo.values);
        this.valuesYaml = jsyaml.safeDump(this.value.values);
      }
    }
  },

  asyncData(ctx) {
    return defaultAsyncData(ctx, 'chartInstallAction');
  },

  data() {
    return {
      repo:        null,
      chart:       null,
      version:     null,
      versionInfo: null,
      valuesYaml:  null,

      forceNamespace:    null,
      nameDisabled:      false,

      errors:          null,
      valuesComponent: null,
    };
  },

  computed: {
    showReadme() {
      return !!this.versionInfo?.readme;
    },

    showNameEditor() {
      return !this.nameDisabled || !this.forceNamespace;
    },

    showVersions() {
      return this.chart?.versions.length > 1;
    },

    steps() {
      return [
        {
          name:  'name',
          label: 'Name & Version',
          ready: !!this.chart,
        },
        {
          name:  'values',
          label: 'Chart Options',
          ready: !!this.versionInfo,
        },
        {
          name:  'advanced',
          label: 'Advanced Options',
          ready: !!this.versionInfo,
        },
      ];
    },
  },

  watch: { '$route.query': '$fetch' },

  mounted() {
    const query = this.$route.query;

    if ( query[STEP] >= 2 && !this.value.metadata?.name ) {
      // If you reload the page, go back to 1 because the name and other stuff has been lost...
      this.$router.applyQuery({ [STEP]: 1 });
    } else if ( ( !query[STEP] || query[STEP] === 1 ) && !this.showReadme && !this.showNameEditor && !this.showVersions ) {
      // If there's nothing on page 1, go to page 2
      this.$router.applyQuery({ [STEP]: 2 });
    }

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

    mergeValues(neu) {
      this.value.values = merge({}, neu, this.value.values || {});
    },

    yamlChanged(value) {
      try {
        jsyaml.safeLoad(value);

        this.valuesYaml = value;
      } catch (e) {
      }
    },

    async finish(btnCb) {
      try {
        this.errors = null;
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
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
    },

    installInput() {
      const out = JSON.parse(JSON.stringify(this.value));

      out.chartName = this.chart.chartName;
      out.version = this.$route.query.version;
      out.releaseName = out.metadata.name;
      out.namespace = out.metadata.namespace;
      out.description = out.metadata?.annotations?.[DESCRIPTION_ANNOTATION];

      delete out.metadata;

      // @TODO only save values that differ from defaults?
      out.values = jsyaml.safeLoad(this.valuesYaml);

      return out;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Wizard
    v-else-if="chart"
    :steps="steps"
    :show-banner="false"
    :edit-first-step="true"
    :errors="errors"
    @finish="finish($event)"
  >
    <template #name>
      <div v-if="showReadme" class="row">
        <div class="col span-12">
          <Markdown v-model="versionInfo.readme" class="readme" />
        </div>
      </div>

      <NameNsDescription
        v-if="showNameEditor"
        v-model="value"
        :mode="mode"
        :name-disabled="nameDisabled"
        :force-namespace="forceNamespace"
      />

      <div v-if="showVersions" class="row">
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
      <component
        :is="valuesComponent"
        v-if="valuesComponent"
        v-model="value.values"
        :chart="chart"
        :version="version"
        :version-inforsion-info="versionInfo"
      />
      <YamlEditor
        v-else
        class="yaml-editor"
        :value="valuesYaml"
        @onInput="yamlChanged"
      />
    </template>

    <template #advanced>
      Advanced helm options coming soon..
    </template>
  </Wizard>
</template>

<style lang="scss" scoped>
  .yaml-editor {
    flex: 1;
    min-height: 400px;
  }

  .readme {
    max-height: calc(100vh - 520px);
    margin-bottom: 20px;
    overflow: auto;
  }
</style>
