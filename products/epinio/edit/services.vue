<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import { mapGetters } from 'vuex';
import ServiceModel from '@/products/epinio/models/services.class';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { sortBy } from '@/utils/sort';
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
      errors: [],
      values: {
        meta: {
          name:      this.value.meta?.name,
          namespace: this.value.meta?.namespace
        },
        keyValuePairs: this.value.keyValuePairs,
      },
      namespaces: []
    };
  },

  props: {
    value: {
      type:     Object as PropType<ServiceModel>,
      required: true,
    },
    originalValue: {
      type:     Object as PropType<ServiceModel>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  fetch() {
    this.namespaces = sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
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
        :value="values.meta"
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
