<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import { ROW_COMPUTED, TYPES } from './shared';

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

  created() {
    if (this.type.startsWith(TYPES.EXTENDED)) {
      this.customType = this.type.substring(`${ TYPES.EXTENDED }.`.length);
    } else {
      this.customType = this.type;
    }
  },

  computed: {
    ...ROW_COMPUTED,

    localType() {
      return this.type.startsWith(TYPES.EXTENDED) ? this.type.split('.')[0] : this.type;
    },

    isCustom() {
      return this.localType === TYPES.EXTENDED;
    },

    resourceQuotaLimit() {
      if (this.isCustom) {
        return this.value.spec.resourceQuota?.limit.extended || {};
      }

      return this.value.spec.resourceQuota?.limit || {};
    },

    namespaceDefaultResourceQuotaLimit() {
      if (this.isCustom) {
        return this.value.spec.namespaceDefaultResourceQuota?.limit.extended || {};
      }

      return this.value.spec.namespaceDefaultResourceQuota?.limit || {};
    },

    currentResourceType() {
      return this.isCustom ? this.customType : this.localType;
    },

    customTypeRules() {
      // Return a validation rule that makes the field required when isCustom is true
      if (this.isCustom) {
        return [
          (value) => {
            if (!value) {
              return this.t('resourceQuota.errors.customTypeRequired');
            }

            return undefined;
          }
        ];
      }

      return [];
    }
  },

  methods: {
    updateType(type) {
      const oldResourceKey = this.isCustom ? this.customType : this.localType;

      this.deleteResourceLimits(oldResourceKey);

      if (type === TYPES.EXTENDED) {
        this.customType = '';
      } else {
        this.customType = type;
      }

      this.$emit('type-change', { index: this.index, type });
    },

    updateCustomType(type) {
      const oldType = this.customType;

      this.deleteResourceLimits(oldType);

      this.customType = type;
    },

    updateQuotaLimit(prop, type, val) {
      if (!this.value.spec[prop]) {
        this.value.spec[prop] = { limit: { } };
      }

      if (this.isCustom) {
        if (!this.value.spec[prop].limit.extended) {
          this.value.spec[prop].limit.extended = { };
        }

        this.value.spec[prop].limit.extended[type] = val;

        return;
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
      :value="localType"
      class="mr-10"
      :mode="mode"
      :options="types"
      data-testid="projectrow-type-input"
      @update:value="updateType($event)"
    />
    <LabeledInput
      :value="customType"
      :disabled="!isCustom"
      :required="isCustom"
      :mode="mode"
      :placeholder="t('resourceQuota.resourceIdentifier.placeholder')"
      :rules="customTypeRules"
      class="mr-10"
      data-testid="projectrow-custom-type-input"
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
