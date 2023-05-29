<script lang="ts">
import Vue from 'vue';
import Application from '../../../../../models/applications';
import Loading from '@shell/components/Loading.vue';
import Wizard from '@shell/components/Wizard.vue';
import { EpinioAppSource, EPINIO_TYPES } from '../../../../../types';
import { _CREATE } from '@shell/config/query-params';
import AppInfo, { EpinioAppInfo } from '../../../../../components/application/AppInfo.vue';
import AppSource from '../../../../../components/application/AppSource.vue';
import AppConfiguration, { EpinioAppBindings } from '../../../../../components/application/AppConfiguration.vue';
import AppProgress from '../../../../../components/application/AppProgress.vue';
import { createEpinioRoute } from '../../../../../utils/custom-routing';
import { allHash } from '@shell/utils/promise';

interface Data {
  value?: Application,
  mode: string,
  errors: string[],
  source?: EpinioAppSource,
  bindings?: EpinioAppBindings,
  steps: any[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    Loading,
    Wizard,
    AppInfo,
    AppSource,
    AppConfiguration,
    AppProgress,
  },

  async fetch() {
    const hash: { [key:string]: any } = await allHash({
      ns:     this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE }),
      charts: this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP_CHARTS }),
      info:   this.$store.dispatch(`epinio/info`),
    });

    this.epinioInfo = hash.info;
    this.appChart.chartsList = hash.charts;
    this.originalModel = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.APP });
    // Dissassociate the original model & model. This fixes `Create` after refreshing page with SSR on
    this.value = await this.$store.dispatch(`epinio/clone`, { resource: this.originalModel });
  },

  data() {
    return {
      value:    undefined,
      mode:     _CREATE,
      errors:   [],
      source:   undefined,
      bindings: undefined,
      steps:    [{
        name:    'source',
        label:   this.t('epinio.applications.steps.source.label'),
        subtext: this.t('epinio.applications.steps.source.subtext'),
        ready:   false,
      }, {
        name:    'basics',
        label:   this.t('epinio.applications.steps.basics.label'),
        subtext: this.t('epinio.applications.steps.basics.subtext'),
        ready:   false,
      }, {
        name:       'configurations',
        label:      this.t('epinio.applications.steps.configurations.label'),
        subtext:    this.t('epinio.applications.steps.configurations.subtext'),
        ready:      true,
        nextButton: {
          labelKey: 'epinio.applications.steps.configurations.next',
          style:    'btn role-primary bg-warning'
        }
      }, {
        name:           'progress',
        label:          this.t('epinio.applications.steps.progress.label'),
        subtext:        this.t('epinio.applications.steps.progress.subtext'),
        ready:          false,
        previousButton: { disable: true }
      }],
      appChart:   { chartsList: undefined },
      epinioInfo: undefined
    };
  },

  methods: {
    set(obj: { [key: string]: string}, changes: { [key: string]: string}) {
      Object.entries(changes).forEach(([key, value]: [string, any]) => {
        Vue.set(obj, key, value);
      });
    },

    updateInfo(changes: EpinioAppInfo) {
      this.value.meta = this.value.meta || {};
      this.value.configuration = this.value.configuration || {};
      this.set(this.value.meta, changes.meta);
      this.set(this.value.configuration, { settings: this.appChart.settings });
      this.set(this.value.configuration, changes.configuration);
    },

    updateSource(changes: EpinioAppSource) {
      this.source = {};
      const { appChart, ...cleanChanges } = changes;

      this.appChart.selectedChart = appChart;
      this.value.configuration = this.value.configuration || {};
      this.value.configuration.settings = undefined;

      if (appChart) {
        // app chart actually belongs in config, so stick it in there
        this.set(this.value.configuration, { appchart: appChart });
        const filterChart = this.appChart.chartsList?.find((chart: any) => chart.id === appChart);

        if (filterChart?.settings ) {
          const customValues = Object.keys(filterChart?.settings).reduce((acc:any, key: any) => {
            acc[key] = '';

            return acc;
          }, {});

          this.set(this.value.configuration, { settings: customValues });
          this.set(this.value, { chart: filterChart });
        }
      }

      this.set(this.source, cleanChanges);
    },

    updateManifestConfigurations(changes: string[]) {
      this.set(this.value.configuration, { configurations: changes });
    },

    updateConfigurations(changes: EpinioAppBindings) {
      this.bindings = {};
      this.set(this.bindings, changes);
      this.set(this.value.configuration, [...changes.configurations]);
    },

    cancel() {
      this.$router.replace(this.value.listLocation);
    },

    finish() {
      this.$router.replace(createEpinioRoute(`c-cluster-resource-id`, {
        cluster:  this.$store.getters['clusterId'],
        resource: this.value.type,
        id:       `${ this.value.meta.namespace }/${ this.value.meta.name }`
      }));
    }
  }
});

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="application-wizard"
  >
    <Wizard
      :steps="steps"
      :banner-title="t('epinio.applications.create.title')"
      :banner-title-subtext="t('epinio.applications.create.titleSubText')"
      header-mode="create"
      finish-mode="done"
      :edit-first-step="true"
      @cancel="cancel"
      @finish="finish"
    >
      <template #source>
        <AppSource
          :application="value"
          :source="source"
          :mode="mode"
          :info="epinioInfo"
          @change="updateSource"
          @changeAppInfo="updateInfo"
          @changeAppConfig="updateManifestConfigurations"
          @valid="steps[0].ready = $event"
        />
      </template>
      <template #basics>
        <AppInfo
          :application="value"
          :mode="mode"
          @change="updateInfo"
          @valid="steps[1].ready = $event"
        />
      </template>
      <template #configurations>
        <AppConfiguration
          :application="value"
          :mode="mode"
          @change="updateConfigurations"
        />
      </template>
      <template #progress="{step}">
        <AppProgress
          :application="value"
          :source="source"
          :bindings="bindings"
          :mode="mode"
          :step="step"
        />
      </template>
    </Wizard>
  </div>
</template>

<style lang='scss' scoped>
.application-wizard {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
