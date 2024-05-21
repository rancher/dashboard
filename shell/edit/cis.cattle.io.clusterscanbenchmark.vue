<script>
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { mapGetters } from 'vuex';
import { CONFIG_MAP } from '@shell/config/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { labelSelectPaginationFunction } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import paginationUtils from '@shell/utils/pagination-utils';

const providers = ['aks', 'docker', 'eks', 'gke', 'k3s', 'minikube', 'rke-windows', 'rke', 'rke2'];

export default {
  components: {
    CruResource, LabeledSelect, LabeledInput, NameNsDescription
  },

  mixins: [createEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    }

  },

  async fetch() {
    if (!paginationUtils.isEnabled({ rootGetters: this.$store.getters }, { store: 'cluster', resource: { id: CONFIG_MAP } })) {
      this.configMaps = await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
    }
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', {});
    }

    return { configMaps: [], providers };
  },

  computed: {
    customConfigMap: {
      get() {
        const { customBenchmarkConfigMapName = '', customBenchmarkConfigMapNamespace } = this.value?.spec;

        return customBenchmarkConfigMapNamespace ? `${ customBenchmarkConfigMapNamespace }/${ customBenchmarkConfigMapName }` : customBenchmarkConfigMapName;
      },
      set(neu) {
        const { name, namespace } = neu.metadata;

        this.$set(this.value.spec, 'customBenchmarkConfigMapName', name);
        this.$set(this.value.spec, 'customBenchmarkConfigMapNamespace', namespace);
      }
    },

    ...mapGetters({ t: 'i18n/t' }),
  },

  methods: {
    /**
     * @param [PaginateFnOptions] opts
     * @returns PaginateFnResponse
     */
    async paginateConfigMap(opts) {
      const { filter } = opts;
      const filters = !!filter ? [PaginationParamFilter.createMultipleFields([
        {
          field: 'metadata.name', value: filter, equals: true
        },
        {
          field: 'metadata.namespace', value: filter, equals: true
        },
      ])] : [];

      return labelSelectPaginationFunction({
        opts,
        filters,
        type: CONFIG_MAP,
        ctx:  { getters: this.$store.getters, dispatch: this.$store.dispatch }
      });
    },
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
    @error="e=>errors = e"
  >
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          :mode="mode"
          :value="value"
          :namespaced="false"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.spec.clusterProvider"
          :clearable="true"
          :options="providers"
          :mode="mode"
          :label="t('cis.clusterProvider')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="customConfigMap"
          :clearable="true"
          :get-option-label="opt=>canPaginate ? (opt.metadata.name || '') : opt.id"
          option-key="id"
          :options="configMaps"
          :mode="mode"
          :paginate="paginateConfigMap"
          :label="t('cis.customConfigMap')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.minKubernetesVersion"
          :mode="mode"
          :label="t('cis.minKubernetesVersion')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.maxKubernetesVersion"
          :mode="mode"
          :label="t('cis.maxKubernetesVersion')"
        />
      </div>
    </div>
  </CruResource>
</template>
