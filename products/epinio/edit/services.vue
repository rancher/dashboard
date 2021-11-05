<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import { mapGetters } from 'vuex';
import ServiceModel from '@/products/epinio/models/services.class';
import { EPINIO_TYPES } from '@/products/epinio/types';
import KeyValue from '@/components/form/KeyValue.vue';

export default Vue.extend({
  components: {
    Loading,
    CruResource,
    NameNsDescription,
    KeyValue
  },
  mixins: [CreateEditView],

  data() {
    return {
      errors:        [],
      value:         {} as PropType<ServiceModel>,
      originalValue: {} as PropType<ServiceModel>,
      namespaces: []
    };
  },

  props: {
    mode: {
      type:     String,
      required: true
    },
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  async fetch() {
    this.namespaces = await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
    this.originalValue = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.SERVICE });
    // Dissassociate the original model & model. This fixes `Create` after refreshing page with SSR on
    this.value = await this.$store.dispatch(`epinio/clone`, { resource: this.originalValue });
  },
});
</script>

<template>
  <div>
    <Loading v-if="!value || namespaces.length === 0" />
    <CruResource
      v-if="value && namespaces.length > 0"
      :can-yaml="false"
      :mode="mode"
      :resource="value"
      :errors="errors"
      @error="e=>errors = e"
      @finish="save"
    >
      <NameNsDescription
        name-key="name"
        namespace-key="namespace"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="value.meta"
        :mode="mode"
      />
      <KeyValue
        v-model="values.keyValuePairs"
        :mode="mode"
        :title="t('epinio.services.pairs')"
        :key-label="t('epinio.applications.create.envvar.keyLabel')"
        :value-label="t('epinio.applications.create.envvar.valueLabel')"
      />
    </CruResource>
  </div>
</template>
