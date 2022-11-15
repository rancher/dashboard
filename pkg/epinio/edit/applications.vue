<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Loading from '@shell/components/Loading.vue';
import AppInfo from '../components/application/AppInfo.vue';
import AppConfiguration, { EpinioAppBindings } from '../components/application/AppConfiguration.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';

interface Data {
  bindings: EpinioAppBindings,
  errors: string[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return {
      bindings: {
        configurations: [],
        services:       []
      },
      errors: []
    };
  },

  components: {
    Loading,
    CruResource,
    ResourceTabs,
    Tab,
    AppInfo,
    AppConfiguration
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
        saveCb(true);
        this.done();
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

    updateInfo(changes: any) {
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
  }

});
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
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
