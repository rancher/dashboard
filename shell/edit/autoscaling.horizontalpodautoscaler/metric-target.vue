<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@shell/components/form/LabeledInput';
import { findBy } from '@shell/utils/array';
import filter from 'lodash/filter';
import UnitInput from '@shell/components/form/UnitInput';
import { parseSi } from '@shell/utils/units';

export default {
  components: {
    LabeledSelect,
    LabeledInput,
    UnitInput,
  },
  props: {
    value: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: 'create',
    },

    metricResource: {
      type:     String,
      required: true,
    },

    resourceName: {
      type:    String,
      default: null,
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
        default:    80,
      },
      {
        label:      this.t('hpa.metricTarget.value.label'),
        value:      'Value',
        specKey:    'value',
        validTypes: ['object', 'external'],
      },
    ];

    const targetTypes = filter(out, (item) => {
      return item.validTypes.includes(this.metricResource);
    });

    const quantity = this.initQuantity();

    return { targetTypes, quantity };
  },
  computed: {
    isResourceMetricType() {
      return this.metricResource === 'resource';
    },
  },

  watch: {
    resourceName(newRn, _oldRn) {
      // debugger;
      const {
        value: { type: metricType },
        targetTypes,
      } = this;
      const match = findBy(targetTypes, { value: metricType });
      let nueDefault = match?.default ?? '80';

      if (metricType !== 'Utilization') {
        if (newRn === 'cpu') {
          nueDefault = `${ nueDefault }m`;
        } else if (newRn === 'memory') {
          nueDefault = `${ nueDefault }Mi`;
        }
      }

      this.$set(this.value, match?.specKey, nueDefault);
      this.quantity = nueDefault;
    },

    'value.type'(targetType, oldType) {
      // debugger;
      const { targetTypes, resourceName } = this;
      const toDelete = findBy(targetTypes, { value: oldType });
      const nue = findBy(targetTypes, { value: targetType });
      let nueDefault = nue?.default ?? '80';

      if (targetType !== 'Utilization') {
        if (resourceName === 'cpu') {
          nueDefault = `${ nueDefault }m`;
        } else if (resourceName === 'memory') {
          nueDefault = `${ nueDefault }Mi`;
        }
      }

      delete this.value[toDelete.specKey];

      this.$set(this.value, nue?.specKey, nueDefault);
      this.quantity = nueDefault;
    },
  },

  methods: {
    initQuantity() {
      const { isResourceMetricType, mode, value } = this;
      let quantity;

      // only parse si on a metric type of Resource because that is the only item we know for sure has an SI suffix
      // other wise users that created a HPA outside of UI will have something like 1k converted to 1000, which is accurate but is not what is represented in the yaml for example.
      // this is also what ember ui does
      if (mode === 'edit' && isResourceMetricType) {
        if (value?.averageValue) {
          quantity = parseSi(value.averageValue);
        } else if (value?.averageUtilization) {
          quantity = value.averageUtilization;
        } else if (value?.value) {
          quantity = parseSi(value.value);
        }
      } else {
        quantity =
          value?.averageValue || value?.averageUtilization || value?.value;
      }

      return quantity;
    },
    updateQuantityValue(val) {
      if (this.value?.type === 'Value') {
        this.$set(this.value, 'value', val);
      } else {
        this.$set(this.value, 'averageValue', val);
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
      <div v-if="isResourceMetricType" class="col span-6">
        <UnitInput
          v-if="value.type === 'Utilization'"
          v-model="value.averageUtilization"
          :label="t('hpa.metricTarget.quantity.label')"
          :mode="mode"
          placeholder="80"
          :required="true"
          :suffix="t('suffix.percent')"
        />
        <UnitInput
          v-else-if="resourceName === 'cpu'"
          v-model="quantity"
          :input-exponent="-1"
          :label="t('hpa.metricTarget.quantity.label')"
          :mode="mode"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :required="true"
          :base-unit="t('suffix.cpus')"
          :output-modifier="true"
          @input="updateQuantityValue"
        />
        <UnitInput
          v-else-if="resourceName === 'memory'"
          v-model="quantity"
          :input-exponent="2"
          :label="t('containerResourceLimit.requestsMemory')"
          :mode="mode"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :required="true"
          :output-modifier="true"
          :increment="1024"
          @input="updateQuantityValue"
        />
      </div>
      <div v-else class="col span-6">
        <LabeledInput
          v-model="quantity"
          placeholder="1"
          type="text"
          :label="t('hpa.metricTarget.quantity.label')"
          :mode="mode"
          :required="true"
          @input="updateQuantityValue"
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
