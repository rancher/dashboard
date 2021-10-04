<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import FileSelector from '@/components/form/FileSelector.vue';
import CruResource from '@/components/CruResource.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
// import { exceptionToErrorsArray } from '@/utils/error';

// interface ComponentData {
//   value: Application;
//   errors: string[]
// }

export default Vue.extend({

  components: {
    Loading,
    CruResource,
    NameNsDescription,
    FileSelector
  },

  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
  },

  mixins:     [
    CreateEditView,
  ],

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
  },

  data() {
    return { errors: [] };
  },

  computed: {
    namespaces() {
      // TODO: RC sort
      return this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE);
    },
    valid() {
      return false; // TODO: RC
    },
  },

  methods: {
    onFileSelected(value: { name: string, value: any }) {
      const { name: fileName, value: fileContent } = value;

      console.log(fileName, fileContent); // eslint-disable-line no-console
    },

    async saveOverride(buttonDone: (res: boolean) => void) {
      try {
        const res = await this.value.save();

        console.warn(res); // eslint-disable-line no-console

        //  this.done();
        buttonDone(true);
      } catch (e) {
        // this.errors = exceptionToErrorsArray(e); // TODO: RC invalid reference
        buttonDone(false);
      }
    }
  }
});
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :done-route="doneRoute"
    :can-yaml="false"
    :errors="errors"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <div>
      <NameNsDescription
        name-key="name"
        namespace-key="workload"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="value"
        :mode="mode"
        class="mt-10"
      />
      <!-- TODO: Label -->
      <FileSelector class="role-tertiary add mt-5" :label="t('generic.readFromFile')" :include-file-name="true" :mode="mode" @selected="onFileSelected" />

      <br><br>
      Debug<br>
      Mode: {{ mode }}<br>
      Value: {{ JSON.stringify(value) }}<br>
      originalValue: {{ JSON.stringify(originalValue) }}<br>
    </div>
  </CruResource>
</template>
