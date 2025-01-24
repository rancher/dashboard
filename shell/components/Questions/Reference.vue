<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

import { PVC, STORAGE_CLASS } from '@shell/config/types';
import Question from './Question';

// Older versions of rancher document these words as valid types
const LEGACY_MAP = {
  storageclass: STORAGE_CLASS,
  pvc:          PVC,
};

export default {
  emits: ['update:value'],

  components: { LabeledInput, ResourceLabeledSelect },
  mixins:     [Question],

  props: {
    inStore: {
      type:    String,
      default: 'cluster',
    },

    targetNamespace: {
      type:    String,
      default: null,
    },
  },

  data() {
    const t = this.question.type;

    let typeName;

    const match = t.match(/^reference\[(.*)\]$/);

    if ( match ) {
      typeName = match?.[1];
    } else {
      typeName = LEGACY_MAP[t] || t;
    }

    let typeSchema;

    if ( typeName ) {
      typeSchema = this.$store.getters[`${ this.inStore }/schemaFor`](typeName);
    }

    return {
      typeName,
      typeSchema,
      all:                 [],
      allResourceSettings: {
        updateResources: (all) => {
          // Filter to only include required namespaced resources
          const resources = this.isNamespaced ? all.filter((r) => r.metadata.namespace === this.targetNamespace) : all;

          return this.mapResourcesToOptions(resources);
        }
      },
      paginateResourceSetting: {
        updateResources: (resources) => {
          return this.mapResourcesToOptions(resources);
        },
        /**
          * of type PaginateTypeOverridesFn
          * @param [LabelSelectPaginationFunctionOptions] opts
          * @returns LabelSelectPaginationFunctionOptions
         */
        requestSettings: (opts) => {
          // Filter to only include required namespaced resources
          const filters = this.isNamespaced ? [
            PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: this.targetNamespace }),
          ] : [];

          return {
            ...opts,
            filters,
            groupByNamespace: false,
            classify:         true,
          };
        }
      },
    };
  },

  methods: {
    mapResourcesToOptions(resources) {
      return resources.map((r) => {
        if (r.id) {
          return {
            label: r.nameDisplay || r.metadata.name,
            value: r.metadata.name
          };
        } else {
          return r;
        }
      });
    },

  },

  computed: {
    isNamespaced() {
      return !!this.typeSchema?.attributes?.namespaced;
    },
  },
};
</script>

<template>
  <div
    v-if="typeSchema"
    class="row"
  >
    <div class="col span-6">
      <ResourceLabeledSelect
        :resource-type="typeName"
        :in-store="inStore"
        :disabled="$fetchState.pending || disabled"
        :label="displayLabel"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        :tooltip="displayTooltip"
        :paginated-resource-settings="paginateResourceSetting"
        :all-resources-settings="allResourceSettings"
        @update:value="!$fetchState.pending && $emit('update:value', $event)"
      />
    </div>
    <div class="col span-6 mt-10">
      {{ typeSchema.attributes.kind }}<span v-if="isNamespaced"> in namespace {{ targetNamespace }}</span>
      <div v-if="showDescription">
        {{ question.description }}
      </div>
    </div>
  </div>
  <div
    v-else
    class="row"
  >
    <div class="col span-6">
      <LabeledInput
        :mode="mode"
        :disabled="$fetchState.pending || disabled"
        :label="displayLabel"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        :tooltip="displayTooltip"
        @update:value="!$fetchState.pending && $emit('update:value', $event)"
      />
    </div>
    <div class="col span-6 mt-10">
      {{ question.type }}<span v-if="isNamespaced"> in namespace {{ targetNamespace }}</span>
      <div v-if="showDescription">
        {{ question.description }}
      </div>
      <div class="text-error">
        (You do not have access to list this type)
      </div>
    </div>
  </div>
</template>
