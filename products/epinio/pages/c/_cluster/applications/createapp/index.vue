<script lang="ts">
import Vue from 'vue';
import Application from '@/products/epinio/models/applications';
import CreateEditView from '@/mixins/create-edit-view/impl';
import Loading from '@/components/Loading.vue';
import Wizard from '@/components/Wizard.vue';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { _CREATE } from '@/config/query-params';
import AppInfo from '@/products/epinio/components/application/AppInfo.vue';
import AppSource, { EpinioAppSource } from '@/products/epinio/components/application/AppSource.vue';
import AppService from '@/products/epinio/components/application/AppService.vue';
import AppProgress from '@/products/epinio/components/application/AppProgress.vue';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';

interface Data {
  value?: Application,
  originalValue?: Application,
  mode: string,
  errors: string[],
  source?: EpinioAppSource,
  steps: any[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    Loading,
    Wizard,
    AppInfo,
    AppSource,
    AppService,
    AppProgress,
  },

  mixins:     [
    CreateEditView,
  ],

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });

    this.originalModel = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.APP });
    // Dissassociate the original model & model. This fixes `Create` after refreshing page with SSR on
    this.value = await this.$store.dispatch(`epinio/clone`, { resource: this.originalModel });
  },

  data() {
    return {
      value:         undefined,
      originalValue: undefined,
      mode:          _CREATE,
      errors:        [],
      source:        undefined,
      steps:         [{
        name:           'basics',
        label:          this.t('epinio.applications.steps.basics.label'),
        subtext:        this.t('epinio.applications.steps.basics.subtext'),
        ready:          false,
      }, {
        name:           'source',
        label:          this.t('epinio.applications.steps.source.label'),
        subtext:        this.t('epinio.applications.steps.source.subtext'),
        ready:          false,
      }, {
        name:           'services',
        label:          this.t('epinio.applications.steps.services.label'),
        subtext:        this.t('epinio.applications.steps.services.subtext'),
        ready:          true,
        nextButton: {
          labelKey: 'epinio.applications.steps.services.next',
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

    updateInfo(changes: any) {
      this.value.meta = this.value.meta || {};
      this.value.configuration = this.value.configuration || {};
      this.set(this.value.meta, changes.meta);
      this.set(this.value.configuration, changes.configuration);
    },

    updateSource(changes: any) {
      this.source = {};
      this.set(this.source, changes);
    },

    updateServices(changes: string[]) {
      this.set(this.value.configuration, { services: changes });
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
          @valid="steps[0].ready = $event"
        ></AppInfo>
      </template>
      <template #source>
        <AppSource
          :application="value"
          :source="source"
          :mode="mode"
          @change="updateSource"
          @valid="steps[1].ready = $event"
        ></AppSource>
      </template>
      <template #services>
        <AppService
          :application="value"
          :mode="mode"
          @change="updateServices"
        ></AppService>
      </template>
      <template #progress="{step}">
        <AppProgress
          :application="value"
          :source="source"
          :mode="mode"
          :step="step"
        ></AppProgress>
      </template>
    </Wizard>
    <!-- <br><br>
    Debug<br>
    Mode: {{ mode }}<br>
    Value: {{ JSON.stringify(value) }}<br>
    originalValue: {{ JSON.stringify(originalValue) }}<br>
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
