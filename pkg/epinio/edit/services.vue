<script lang="ts">
import Vue, { PropType } from 'vue';
import ServiceInstance from '../models/services';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { EpinioCatalogServiceResource, EPINIO_TYPES } from '../types';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';
import { sortBy } from '@shell/utils/sort';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import EpinioBindAppsMixin from './bind-apps-mixin.js';
import { mapGetters } from 'vuex';

export const EPINIO_SERVICE_PARAM = 'service';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    Loading,
    CruResource,
    LabeledSelect,
    NameNsDescription,
  },

  mixins: [CreateEditView, EpinioBindAppsMixin],

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

  async fetch() {
    await Promise.all([
      this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.CATALOG_SERVICE }),
      this.mixinFetch()
    ]);

    Vue.set(this.value, 'catalog_service', this.$route.query[EPINIO_SERVICE_PARAM]);
    Vue.set(this.value.meta, 'namespace', this.initialValue.meta.namespace || this.namespaces[0]?.meta.name);
  },

  data() {
    return {
      errors:                 [],
      failedWaitingForDeploy: false,
      selectedApps:           this.value.boundapps || []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    validationPassed() {
      if (!this.value.catalog_service) {
        return false;
      }

      const nameErrors = validateKubernetesName(this.value?.name || '', this.t('epinio.namespace.name'), this.$store.getters, undefined, []);
      const nsErrors = validateKubernetesName(this.value?.meta.namespace || '', '', this.$store.getters, undefined, []);

      if (nameErrors.length === 0 && nsErrors.length === 0) {
        return !this.failedWaitingForDeploy;
      }

      return false;
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
    },

  },

  methods: {
    async save(saveCb: (success: boolean) => void) {
      this.errors = [];
      try {
        if (this.isCreate) {
          await this.value.create();
          if (this.selectedApps.length) {
            await this.updateServiceInstanceAppBindings(this.value);
          }
          await this.$store.dispatch('epinio/findAll', { type: this.value.type, opt: { force: true } });
        }

        if (this.isEdit) {
          await this.updateServiceInstanceAppBindings(this.value);
          await this.value.forceFetch();
        }

        saveCb(true);
        this.done();
      } catch (err: Error | any) {
        if (err.message === 'waitingForDeploy') {
          Vue.set(this, 'failedWaitingForDeploy', true);
          this.errors = [this.t('epinio.serviceInstance.create.catalogService.failedWaitingForDeploy')];
        } else {
          this.errors = epinioExceptionToErrorsArray(err);
        }
        saveCb(false);
      }
    },
  },

  watch: {
    'value.meta.namespace'() {
      Vue.set(this, 'selectedApps', []);
    }
  }

});
</script>

<template>
  <Loading v-if="!value || $fetchState.pending" />
  <CruResource
    v-else-if="value"
    :can-yaml="false"
    :done-route="doneRoute"
    :mode="mode"
    :validation-passed="validationPassed"
    :resource="value"
    :errors="errors"
    namespace-key="meta.namespace"
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
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.catalog_service"
          :loading="$fetchState.pending"
          :options="catalogServiceOpts"
          :disabled="$fetchState.pending || isEdit"
          :searchable="true"
          :mode="mode"
          :multiple="false"
          :label-key="'epinio.serviceInstance.create.catalogService.label'"
          :placeholder="$fetchState.pending || noCatalogServices ? t('epinio.serviceInstance.create.catalogService.placeholderNoOptions') : t('epinio.serviceInstance.create.catalogService.placeholderWithOptions')"
          required
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedApps"
          :loading="$fetchState.pending"
          :options="nsAppOptions"
          :disabled="noApps || $fetchState.pending"
          :searchable="true"
          :mode="mode"
          :multiple="true"
          :label-key="'epinio.configurations.bindApps.label'"
          :placeholder="$fetchState.pending || noApps ? t('epinio.configurations.bindApps.placeholderNoOptions') : t('epinio.configurations.bindApps.placeholderWithOptions')"
        />
      </div>
    </div>
  </CruResource>
</template>
