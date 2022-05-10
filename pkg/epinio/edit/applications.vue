<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Loading from '@shell/components/Loading.vue';
import AppInfo from '../components/application/AppInfo.vue';
import AppConfiguration from '../components/application/AppConfiguration.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return { errors: [] };
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

    updateConfigurations(changes: string[]) {
      this.set(this.value.configuration, { configurations: changes });
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
    <ResourceTabs v-model="value" mode="mode">
      <Tab label="Info" name="info" :weight="20">
        <AppInfo
          :application="value"
          :mode="mode"
          @change="updateInfo"
        ></AppInfo>
      </Tab>
      <Tab label="Configurations" name="configurations" :weight="10">
        <AppConfiguration
          :application="value"
          :mode="mode"
          @change="updateConfigurations"
        ></AppConfiguration>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
