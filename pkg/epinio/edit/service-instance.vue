<script lang="ts">
import Vue, { PropType } from 'vue';
import ServiceInstance from '../models/service-instance';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { EpinioCatalogServiceResource, EPINIO_TYPES } from '~/pkg/epinio/types';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';
import { sortBy } from '@shell/utils/sort';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';

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
    LabeledSelect,
    NameNsDescription
  },

  props: {
    value: {
      type:     Object as PropType<ServiceInstance>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<ServiceInstance>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  mixins: [CreateEditView],

  methods: {
    async save(saveCb: (success: boolean) => void) {
      this.errors = [];
      try {
        await this.value.create();
        await this.$store.dispatch('epinio/findAll', { type: this.value.type, opt: { force: true } });

        saveCb(true);
        this.done();
      } catch (err) {
        this.errors = epinioExceptionToErrorsArray(err);
        saveCb(false);
      }
    },
  },

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.CATALOG_SERVICE });
  },

  computed: {
    validationPassed() {
      if (!this.value.catalog_service) {
        return false;
      }

      const nameErrors = validateKubernetesName(this.value?.name || '', this.t('epinio.namespace.name'), this.$store.getters, undefined, []);

      return nameErrors.length === 0;
    },

    namespaces() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
    },

    catalogServiceOpts() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.CATALOG_SERVICE).map((cs: EpinioCatalogServiceResource) => ({
        label: `${ cs.name } (${ cs.short_description })`,
        value: cs.name
      }));
    },

    noCatalogServices() {
      return this.catalogServiceOpts.length === 0;
    }
  }
});
</script>

<template>
  <Loading v-if="!value || !namespaces" />
  <div v-else-if="!namespaces.length">
    <Banner color="warning">
      {{ t('epinio.warnings.noNamespace') }}
    </Banner>
  </div>
  <CruResource
    v-else-if="value && namespaces.length > 0"
    :can-yaml="false"
    :mode="mode"
    :validation-passed="validationPassed"
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
      :value="value"
      :mode="mode"
    />
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.catalog_service"
          :loading="$fetchState.pending"
          :options="catalogServiceOpts"
          :disabled="isEdit"
          :searchable="true"
          :mode="mode"
          :multiple="false"
          :label-key="'epinio.serviceInstance.create.catalogService.label'"
          :placeholder="noCatalogServices ? t('epinio.serviceInstance.create.catalogService.placeholderNoOptions') : t('epinio.serviceInstance.create.catalogService.placeholderWithOptions')"
          required
        />
      </div>
    </div>
  </CruResource>
</template>
