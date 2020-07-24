<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Markdown from '@/components/Markdown';
import { CATALOG } from '@/config/types';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { REPO_TYPE, REPO, CHART, VERSION } from '@/config/query-params';
import Wizard from '@/components/Wizard';
import YamlEditor from '@/components/YamlEditor';
import { DESCRIPTION } from '@/config/labels-annotations';
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
    } else {
      this.forceNamespace = null;
    }

    if ( this.chart.targetName ) {
      this.value.metadata.name = this.chart.targetName;
      this.nameDisabled = true;
    } else {
      this.nameDisabled = false;
    }

    if ( version ) {
      this.version = this.$store.getters['catalog/version']({
        repoType, repoName, chartName, version
      });

      this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
        repoType, repoName, chartName, version
      });
      this.mergeValues(this.versionInfo.values);
      this.valuesYaml = jsyaml.safeDump(this.value.values);
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

      errors: null,
    };
  },

  computed: {
    steps() {
      return [
        {
          name:      'chart',
          label:     'Select Chart',
          showSteps: false,
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
  },

  watch: { '$route.query': '$fetch' },

  methods: {
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
      out.description = out.metadata?.[DESCRIPTION];
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
    v-else
    :steps="steps"
    :show-banner="false"
    :errors="errors"
    @finish="finish($event)"
  >
    <template #helm>
      <div v-if="versionInfo.readme" class="row">
        <div class="col span-12">
          <Markdown v-model="versionInfo.readme" class="readme" />
        </div>
      </div>

      <NameNsDescription
        v-model="value"
        :mode="mode"
        :name-disabled="nameDisabled"
        :force-namespace="forceNamespace"
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

    <template v-if="!chart" #next>
      &nbsp;
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
