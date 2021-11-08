<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource.vue';
import ResourceTabs from '@/components/form/ResourceTabs/index.vue';
import Tab from '@/components/Tabbed/Tab.vue';
import Loading from '@/components/Loading.vue';
import AppInfo from '@/products/epinio/components/application/AppInfo.vue';
import AppService from '@/products/epinio/components/application/AppService.vue';
import { epinioExceptionToErrorsArray } from '@/products/epinio/utils/errors';

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
    AppService
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    originalValue: {
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

    updateInfo(changes: any) {
      this.value.meta = this.value.meta || {};
      this.value.configuration = this.value.configuration || {};
      Vue.set(this.value, 'meta', changes.meta);
      Vue.set(this.value, 'configuration', changes.configuration);
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
      <Tab label="Services" name="services" :weight="10">
        <AppService
          :application="value"
          :mode="mode"
        ></AppService>
      </Tab>
    </ResourceTabs>
    <!-- <div>
      EDIT
      Debug<br>
      Mode: {{ mode }}<br><br>
      Value: {{ JSON.stringify(value) }}<br><br>
      originalValue: {{ JSON.stringify(originalValue) }}<br>
    </div> -->
  </CruResource>
</template>
