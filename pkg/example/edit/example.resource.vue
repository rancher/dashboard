<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import { ExampleResource, EXAMPLE_STORE, EXAMPLE_TYPES } from '../types';

export const EPINIO_SERVICE_PARAM = 'service';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    Loading,
    CruResource,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object as PropType<ExampleResource>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<ExampleResource>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  async fetch() {
    // This is only needed as we mock data (load this page, save a new resource, nav to list and the mock data for list won't contain new resource)
    await this.$store.dispatch(`${ EXAMPLE_STORE }/findAll`, { type: EXAMPLE_TYPES.RESOURCE });
  },

  data() {
    return { errors: [] };
  },

});
</script>

<template>
  <Loading v-if="!value || $fetchState.pending" />

  <CruResource
    v-else-if="value"
    :can-yaml="false"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
  >
    <NameNsDescription
      name-key="name"
      description-key="description"
      :namespaced="false"
      :value="value"
      :mode="mode"
    />
  </CruResource>
</template>
