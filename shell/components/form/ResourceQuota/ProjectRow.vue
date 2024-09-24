<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { ROW_COMPUTED } from './shared';

export default {
  emits: ['type-change'],

  components: { Select, UnitInput },

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
    }
  },

  methods: {
    updateType(type) {
      if (typeof this.value.spec.resourceQuota?.limit[this.type] !== 'undefined') {
        delete this.value.spec.resourceQuota.limit[this.type];
      }
      if (typeof this.value.spec.namespaceDefaultResourceQuota?.limit[this.type] !== 'undefined') {
        delete this.value.spec.namespaceDefaultResourceQuota.limit[this.type];
      }

      this.$emit('type-change', type);
    },

    updateQuotaLimit(prop, type, val) {
      if (!this.value.spec[prop]) {
        this.value.spec[prop] = { limit: { } };
      }

      this.value.spec[prop].limit[type] = val;
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
    <UnitInput
      :value="resourceQuotaLimit[type]"
      class="mr-10"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      data-testid="projectrow-project-quota-input"
      @update:value="updateQuotaLimit('resourceQuota', type, $event)"
    />
    <UnitInput
      :value="namespaceDefaultResourceQuotaLimit[type]"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      data-testid="projectrow-namespace-quota-input"
      @update:value="updateQuotaLimit('namespaceDefaultResourceQuota', type, $event)"
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
