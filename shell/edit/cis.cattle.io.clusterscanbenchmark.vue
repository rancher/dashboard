<script>
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { mapGetters } from 'vuex';
import { CONFIG_MAP } from '@shell/config/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

const providers = ['aks', 'docker', 'eks', 'gke', 'k3s', 'minikube', 'rke-windows', 'rke', 'rke2'];

export default {
  components: {
    CruResource, LabeledSelect, ResourceLabeledSelect, LabeledInput, NameNsDescription
  },

  mixins: [createEditView],

  inheritAttrs: false,

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

  data() {
    if (!this.value.spec) {
      this.value['spec'] = {};
    }

    return {
      CONFIG_MAP,
      providers,
      configMapPaginateSettings: {
        labelSelectOptions: { 'get-option-label': (opt) => opt?.metadata?.name || opt.id || opt },
        requestSettings:    this.pageRequestSettings,
      }
    };
  },

  computed: {
    customConfigMap: {
      get() {
        const { customBenchmarkConfigMapName = '', customBenchmarkConfigMapNamespace } = this.value?.spec;

        return customBenchmarkConfigMapNamespace ? `${ customBenchmarkConfigMapNamespace }/${ customBenchmarkConfigMapName }` : customBenchmarkConfigMapName;
      },
      set(neu) {
        const { name, namespace } = neu.metadata;

        this.value.spec['customBenchmarkConfigMapName'] = name;
        this.value.spec['customBenchmarkConfigMapNamespace'] = namespace;
      }
    },

    ...mapGetters({ t: 'i18n/t' }),
  },

  methods: {
    /**
     * @param [LabelSelectPaginationFunctionOptions] opts
     * @returns LabelSelectPaginationFunctionOptions
     */
    pageRequestSettings(opts) {
      const { opts: { filter } } = opts;

      return {
        ...opts,
        classify: true,
        filters:  !!filter ? [PaginationParamFilter.createMultipleFields([
          {
            field: 'metadata.name', value: filter, equals: true
          },
          {
            field: 'metadata.namespace', value: filter, equals: true
          },
        ])] : []
      };
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
          v-model:value="value.spec.clusterProvider"
          :clearable="true"
          :options="providers"
          :mode="mode"
          :label="t('cis.clusterProvider')"
        />
      </div>
      <div class="col span-6">
        <ResourceLabeledSelect
          v-model:value="customConfigMap"
          :clearable="true"
          option-key="id"
          option-label="id"
          :mode="mode"
          :label="t('cis.customConfigMap')"
          :resource-type="CONFIG_MAP"
          :paginated-resource-settings="configMapPaginateSettings"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.minKubernetesVersion"
          :mode="mode"
          :label="t('cis.minKubernetesVersion')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.maxKubernetesVersion"
          :mode="mode"
          :label="t('cis.maxKubernetesVersion')"
        />
      </div>
    </div>
  </CruResource>
</template>
