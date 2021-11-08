<script>
import { _VIEW } from '@/config/query-params';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: {
    LabeledSelect, UnitInput, LabeledInput
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    types: {
      type:    Array,
      default: () => []
    },
    type: {
      type:    String,
      default: ''
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    typed() {
      return this.types.find(type => type.value === this.type);
    },
    isUnitless() {
      return this.typed?.units === 'unitless';
    },

    isCpu() {
      return this.typed?.units === 'cpu';
    },

    isMemory() {
      return this.typed?.units === 'memory';
    },

    isStorage() {
      return this.typed?.units === 'storage';
    }
  },

  methods: {
    updateType(type) {
      if (typeof this.value.spec.resourceQuota.limit[this.type] !== 'undefined') {
        this.$delete(this.value.spec.resourceQuota.limit, this.type);
      }

      if (typeof this.value.spec.namespaceDefaultResourceQuota.limit[this.type] !== 'undefined') {
        this.$delete(this.value.spec.namespaceDefaultResourceQuota.limit, this.type);
      }

      this.$emit('type-change', type);
    }
  },
};
</script>
<template>
  <div class="row">
    <LabeledSelect class="mr-10" :value="type" :options="types" :label="t('resourceQuota.resourceType.label')" @input="updateType($event)" />

    <LabeledInput
      v-if="isUnitless"
      v-model.number="value.spec.resourceQuota.limit[type]"
      class="mr-10"
      :mode="mode"
      :label="t('resourceQuota.projectLimit.label')"
      :placeholder="t('resourceQuota.projectLimit.unitlessPlaceholder')"
      type="number"
    />
    <LabeledInput
      v-if="isUnitless"
      v-model.number="value.spec.namespaceDefaultResourceQuota.limit[type]"
      :mode="mode"
      :label="t('resourceQuota.namespaceDefaultLimit.label')"
      :placeholder="t('resourceQuota.namespaceDefaultLimit.unitlessPlaceholder')"
      type="number"
    />

    <UnitInput
      v-if="isCpu"
      v-model="value.spec.resourceQuota.limit[type]"
      class="mr-10"
      :suffix="t('suffix.cpus')"
      :mode="mode"
      :label="t('resourceQuota.projectLimit.label')"
      :placeholder="t('resourceQuota.projectLimit.cpuPlaceholder')"
      output-suffix-text="m"
      :input-exponent="-1"
    />
    <UnitInput
      v-if="isCpu"
      v-model="value.spec.namespaceDefaultResourceQuota.limit[type]"
      :suffix="t('suffix.cpus')"
      :mode="mode"
      :label="t('resourceQuota.namespaceDefaultLimit.label')"
      :placeholder="t('resourceQuota.namespaceDefaultLimit.cpuPlaceholder')"
      output-suffix-text="m"
      :input-exponent="-1"
    />

    <UnitInput
      v-if="isMemory"
      v-model="value.spec.resourceQuota.limit[type]"
      class="mr-10"
      :suffix="t('suffix.ib')"
      :mode="mode"
      :label="t('resourceQuota.projectLimit.label')"
      :placeholder="t('resourceQuota.projectLimit.memoryPlaceholder')"
      output-suffix-text="Mi"
      :input-exponent="2"
      :increment="1024"
    />
    <UnitInput
      v-if="isMemory"
      v-model="value.spec.namespaceDefaultResourceQuota.limit[type]"
      :suffix="t('suffix.ib')"
      :mode="mode"
      :label="t('resourceQuota.namespaceDefaultLimit.label')"
      :placeholder="t('resourceQuota.namespaceDefaultLimit.memoryPlaceholder')"
      output-suffix-text="Mi"
      :input-exponent="2"
      :increment="1024"
    />

    <UnitInput
      v-if="isStorage"
      v-model="value.spec.resourceQuota.limit[type]"
      class="mr-10"
      :suffix="t('suffix.ib')"
      :mode="mode"
      :placeholder="t('resourceQuota.projectLimit.storagePlaceholder')"
      :label="t('resourceQuota.projectLimit.label')"
      output-suffix-text="Gi"
      :input-exponent="3"
      :increment="1024"
    />
    <UnitInput
      v-if="isStorage"
      v-model="value.spec.namespaceDefaultResourceQuota.limit[type]"
      :suffix="t('suffix.ib')"
      :mode="mode"
      :label="t('resourceQuota.namespaceDefaultLimit.label')"
      :placeholder="t('resourceQuota.namespaceDefaultLimit.storagePlaceholder')"
      output-suffix-text="Gi"
      :input-exponent="3"
      :increment="1024"
    />
  </div>
</template>

<style lang='scss' scoped>
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
  }
</style>
