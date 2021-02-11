<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import { findBy } from '@/utils/array';
import filter from 'lodash/filter';

export default {
  components: { LabeledSelect, LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: 'create',
    },

    type: {
      type:     String,
      required: true,
    },
  },
  data() {
    const out = [
      {
        label:      this.t('hpa.metricTarget.averageVal.label'),
        value:      'AverageValue',
        specKey:    'averageValue',
        validTypes: ['resource', 'pod', 'object', 'external'],
      },
      {
        label:      this.t('hpa.metricTarget.utilization.label'),
        value:      'Utilization',
        specKey:    'averageUtilization',
        validTypes: ['resource'],
      },
      {
        label:      this.t('hpa.metricTarget.value.label'),
        value:      'Value',
        specKey:    'value',
        validTypes: ['object', 'external'],
      },
    ];
    const targetTypes = filter(out, (item) => {
      return item.validTypes.includes(this.type);
    });

    return { targetTypes };
  },
  computed: {
    quantityValue: {
      get() {
        const { value } = this;
        let out = null;

        switch (this.value.type) {
        case 'AverageValue':
          out = value.averageValue;
          break;
        case 'Utilization':
          out = value.averageUtilization;
          break;
        case 'Value':
          out = value.value;
          break;
        default:
          break;
        }

        return out;
      },
      set(v) {
        this.setDynamicValue(this.value.type, v);
      },
    },
  },

  watch: {
    'value.type'(targetType, oldType) {
      const { targetTypes } = this;
      const toDelete = findBy(targetTypes, { value: oldType });

      delete this.value[toDelete.specKey];
    },
  },

  methods: {
    setDynamicValue(switchType, value) {
      switch (switchType) {
      case 'AverageValue':
        this.$set(this.value, 'averageValue', value);
        break;
      case 'Utilization':
        this.$set(
          this.value,
          'averageUtilization',
          value ? parseInt(value, 10) : value
        );
        break;
      case 'Value':
        this.$set(this.value, 'value', value);
        break;
      default:
        break;
      }
    },
  },
};
</script>

<template>
  <div class="metric-target">
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.type"
          :mode="mode"
          :label="t('hpa.metricTarget.type.label')"
          :options="targetTypes"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="quantityValue"
          :mode="mode"
          :label="t('hpa.metricTarget.quantity.label')"
          placeholder="1"
          :required="true"
          type="text"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.metric-target {
  width: 100%;
}
</style>
