<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import { ROW_COMPUTED } from './shared';

export default {
  emits: ['type-change'],

  components: {
    Select,
    UnitInput,
    LabeledInput,
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
    },
    index: {
      type:     Number,
      required: true,
    }
  },

  data() {
    return { customType: '' };
  },

  computed: {
    ...ROW_COMPUTED,

    resourceQuotaLimit: {
      get() {
        return this.value.spec.resourceQuota?.limit || {};
      },
    },

    namespaceDefaultResourceQuotaLimit: {
      get() {
        return this.value.spec.namespaceDefaultResourceQuota?.limit || {};
      },
    },

    currentResourceType() {
      return this.type === 'custom' ? this.customType : this.type;
    }
  },

  methods: {
    updateType(type) {
      const oldResourceKey = this.type === 'custom' ? this.customType : this.type;

      this.deleteResourceLimits(oldResourceKey);

      if (type === 'custom' || this.type === 'custom') {
        this.customType = '';
      }

      this.$emit('type-change', { index: this.index, type });
    },

    updateCustomType(type) {
      const oldType = this.customType;

      this.deleteResourceLimits(oldType);

      this.customType = type;
      if (this.type === 'custom') {
        this.$emit('type-change', { index: this.index, type });
      }
    },

    updateQuotaLimit(prop, type, val) {
      if (!this.value.spec[prop]) {
        this.value.spec[prop] = { limit: { } };
      }

      this.value.spec[prop].limit[type] = val;
    },

    deleteResourceLimits(resourceKey) {
      if (typeof this.value.spec.resourceQuota?.limit[resourceKey] !== 'undefined') {
        delete this.value.spec.resourceQuota.limit[resourceKey];
      }
      if (typeof this.value.spec.namespaceDefaultResourceQuota?.limit[resourceKey] !== 'undefined') {
        delete this.value.spec.namespaceDefaultResourceQuota.limit[resourceKey];
      }
    }
  },
};
</script>
<template>
  <div
    v-if="typeOption"
    class="row"
  >
    <Select
      :value="type"
      class="mr-10"
      :mode="mode"
      :options="types"
      data-testid="projectrow-type-input"
      @update:value="updateType($event)"
    />
    <LabeledInput
      :value="customType"
      :disabled="type !== 'custom'"
      :mode="mode"
      :placeholder="t('resourceQuota.resourceIdentifier.placeholder')"
      class="mr-10"
      @update:value="updateCustomType($event)"
    />
    <UnitInput
      :value="resourceQuotaLimit[currentResourceType]"
      class="mr-10"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      data-testid="projectrow-project-quota-input"
      @update:value="updateQuotaLimit('resourceQuota', currentResourceType, $event)"
    />
    <UnitInput
      :value="namespaceDefaultResourceQuotaLimit[currentResourceType]"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      data-testid="projectrow-namespace-quota-input"
      @update:value="updateQuotaLimit('namespaceDefaultResourceQuota', currentResourceType, $event)"
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
