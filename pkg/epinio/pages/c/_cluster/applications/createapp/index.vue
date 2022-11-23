<script lang="ts">
import Vue from 'vue';
import Application from '../../../../../models/applications';
import CreateEditView from '@shell/mixins/create-edit-view/impl';
import Loading from '@shell/components/Loading.vue';
import Wizard from '@shell/components/Wizard.vue';
import { EPINIO_TYPES } from '../../../../../types';
import { _CREATE } from '@shell/config/query-params';
import AppInfo, { EpinioAppInfo } from '../../../../../components/application/AppInfo.vue';
import AppSource, { EpinioAppSource } from '../../../../../components/application/AppSource.vue';
import AppConfiguration, { EpinioAppBindings } from '../../../../../components/application/AppConfiguration.vue';
import AppProgress from '../../../../../components/application/AppProgress.vue';
import { createEpinioRoute } from '../../../../../utils/custom-routing';

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

  mixins: [
    CreateEditView,
  ],

  async fetch() {
    await Promise.all([
      this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE }),
      this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP_CHARTS }),
    ]);

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
      }]
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
      this.set(this.value.configuration, changes.configuration);
    },

    updateSource(changes: EpinioAppSource) {
      this.source = {};
      const { appChart, ...cleanChanges } = changes;

      if (appChart) {
        // app chart actuall belongs in config, so stick it in there
        this.value.configuration = this.value.configuration || {};
        this.set(this.value.configuration, { appchart: appChart });
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
      <template #basics>
        <AppInfo
          :application="value"
          :mode="mode"
          @change="updateInfo"
          @valid="steps[1].ready = $event"
        />
      </template>
      <template #source>
        <AppSource
          :application="value"
          :source="source"
          :mode="mode"
          @change="updateSource"
          @changeAppInfo="updateInfo"
          @changeAppConfig="updateManifestConfigurations"
          @valid="steps[0].ready = $event"
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
    <!-- <br><br>
    Debug<br>
    Mode: {{ mode }}<br>
    Value: {{ JSON.stringify(value) }}<br>
    initialValue: {{ JSON.stringify(initialValue) }}<br>
    source: {{ JSON.stringify(source) }}<br> -->
  </div>
</template>

<style lang='scss' scoped>
.application-wizard {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 0;
}
</style>
