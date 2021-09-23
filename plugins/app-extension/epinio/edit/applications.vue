<script lang="ts">
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import FileSelector from '@/components/form/FileSelector.vue';
import CruResource from '@/components/CruResource.vue';

import { EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';

export default {
  components: {
    Loading,
    CruResource,
    NameNsDescription,
    FileSelector
  },

  mixins:     [
    CreateEditView,
  ],

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
  },

  data() {
    return {};
  },

  computed: {
    namespaces() {
      // TODO: RC sort
      return this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE);
    },
    valid() {
      return false;
    },
  },

  methods: {
    onFileSelected(value: { name: string, value: any }) {
      const { name: fileName, value: fileContent } = value;

      console.log(fileName, fileContent);
    },
  }
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :done-route="doneRoute"
    :can-yaml="false"
    @finish="save"
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
