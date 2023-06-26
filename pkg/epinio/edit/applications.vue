<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Loading from '@shell/components/Loading.vue';
import AppInfo, { EpinioAppInfo } from '../components/application/AppInfo.vue';
import AppConfiguration, { EpinioAppBindings } from '../components/application/AppConfiguration.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import Wizard from '@shell/components/Wizard.vue';
import { createEpinioRoute } from '../utils/custom-routing';
import AppSource from '../components/application/AppSource.vue';
import { _EDIT } from '@shell/config/query-params';

import AppProgress from '../components/application/AppProgress.vue';
import { EpinioAppSource, EpinioCompRecord, EPINIO_TYPES } from '../types';
import { allHash } from '@shell/utils/promise';

interface Data {
  bindings: EpinioAppBindings,
  source?: EpinioAppSource,
  errors: string[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, EpinioCompRecord, EpinioCompRecord, EpinioCompRecord>({
  components: {
    AppSource,
    AppProgress,
    Loading,
    CruResource,
    ResourceTabs,
    Tab,
    AppInfo,
    Wizard,
    AppConfiguration
  },

  data() {
    const source = this.value.appSource;

    /**
     * Edit git application from specific commit
     */
    if (source.git && this.$route.query?.commit) {
      source.git.commit = this.$route?.query?.commit;
    }

    return {
      bindings: {
        configurations: [],
        services:       []
      },
      errors: [],
      source,
      steps:  [
        {
          name:       'source',
          label:      this.t('epinio.applications.steps.source.label'),
          subtext:    this.t('epinio.applications.steps.source.subtext'),
          ready:      false,
          nextButton: {
            labelKey: 'epinio.applications.steps.configurations.update',
            style:    'btn role-primary bg-warning'
          }
        }, {
          name:           'progress',
          label:          this.t('epinio.applications.steps.progress.label'),
          subtext:        this.t('epinio.applications.steps.progress.subtext'),
          ready:          false,
          previousButton: { disable: true }
        },
      ],
      epinioInfo: undefined
    };
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  async fetch() {
    const hash: { [key:string]: any } = await allHash({
      ns:     this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE }),
      charts: this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP_CHARTS }),
      info:   this.$store.dispatch('epinio/info'),
    });

    this.epinioInfo = hash.info;
  },

  computed: {
    shouldShowButtons() {
      return this.$route.hash === '#source' ? 'hide-buttons-deploy' : '';
    },
    showSourceTab() {
      return this.mode === _EDIT;
    },
  },

  methods: {
    async save(saveCb: (success: boolean) => void) {
      this.errors = [];
      try {
        await this.value.update();

        await this.value.updateConfigurations(
          this.initialValue.baseConfigurationsNames || [],
          this.bindings?.configurations || [],
        );

        await this.value.updateServices(
          this.initialValue.services || [],
          this.bindings?.services || [],
        );

        await this.value.forceFetch();
        if (!this._isBeingDestroyed || !this._isDestroyed) {
          saveCb(true);
          this.done();
        }
      } catch (err) {
        this.errors = epinioExceptionToErrorsArray(err);
        saveCb(false);
      }
    },

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

    updateConfigurations(changes: EpinioAppBindings) {
      Vue.set(this, 'bindings', changes);
      this.set(this.value.configuration, [
        ...changes.configurations,
        // .map(s => s.meta.name)
        // ...changes.services
      ]);
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
    },

    updateSource(changes: EpinioAppSource) {
      this.source = {};
      const { appChart, ...cleanChanges } = changes;

      this.value.configuration = this.value.configuration || {};

      if (appChart) {
        // app chart actually belongs in config, so stick it in there
        this.set(this.value.configuration, { appchart: appChart });
      }

      this.set(this.source, cleanChanges);
    },

    updateManifestConfigurations(changes: string[]) {
      this.set(this.value.configuration, { configurations: changes });
    },
  },
});
</script>

<template>
  <Loading v-if="!value || $fetchState.pending" />
  <CruResource
    v-else
    :class="shouldShowButtons"
    :can-yaml="false"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
  >
    <ResourceTabs
      v-model="value"
      mode="mode"
    >
      <Tab
        v-if="showSourceTab"
        label-key="epinio.applications.steps.source.label"
        name="source"
        :weight="30"
      >
        <div class="wizard-container">
          <Wizard
            class="wizard"
            :steps="steps"
            :banner-title="t('epinio.applications.steps.source.label')"
            :banner-title-subtext="t('epinio.applications.steps.source.subtext')"
            header-mode="edit"
            finish-mode="done"
            :edit-first-step="true"
            @cancel="cancel"
            @finish="finish"
          >
            <template #source>
              <AppSource
                v-if="source"
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
      </Tab>
      <Tab
        label-key="epinio.applications.steps.basics.label"
        name="info"
        :weight="20"
      >
        <AppInfo
          :application="value"
          :mode="mode"
          @change="updateInfo"
        />
      </Tab>
      <Tab
        label-key="epinio.applications.steps.configurations.label"
        name="configurations"
        :weight="10"
      >
        <AppConfiguration
          :application="value"
          :initial-application="initialValue"
          :mode="mode"
          @change="updateConfigurations"
        />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>

<style lang='scss' scoped>

.wizard-container {
  position: relative;

  margin-bottom: -20px;
  margin-right: -20px;

  .wizard {
    position: relative;
    overflow: auto;

    // This is a hack and is needed as the wizard's buttons are now `position: absolute; bottom: 0;` so appears over wizard content
    // In the dashabord app chart install wizard this is applied to specific content winthin the wizard (scroll__content)
    // We applied the same thing here
    // Both places need to be removed and the padding added within the wizard component
    .appSource, .progress-container {
      padding-bottom: 75px;
    }
  }
}

</style>

<style lang="scss">
.hide-buttons-deploy {
  .cru__footer {
    display: none !important;
  }
}

</style>
