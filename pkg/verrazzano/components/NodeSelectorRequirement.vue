<script>
// Added by Verrazzano
import ArrayList from '@shell/components/form/ArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NodeSelectorRequirement',
  components: {
    ArrayList,
    LabeledInput,
    LabeledSelect,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  computed: {
    values() {
      const localValues = this.value.values || [];
      let result;

      if (this.isValuesSingleElement) {
        result = localValues.length ? localValues[0] : undefined;
      } else if (this.isValuesMultipleElements) {
        result = localValues;
      } else {
        result = [];
      }

      return result;
    },
    nodeOperators() {
      return [
        { label: this.t('verrazzano.common.types.matchExpressionOperators.in'), value: 'In' },
        { label: this.t('verrazzano.common.types.matchExpressionOperators.notIn'), value: 'NotIn' },
        { label: this.t('verrazzano.common.types.matchExpressionOperators.exists'), value: 'Exists' },
        { label: this.t('verrazzano.common.types.matchExpressionOperators.doesNotExist'), value: 'DoesNotExist' },
        { label: this.t('verrazzano.common.types.matchExpressionOperators.lessThan'), value: 'Lt' },
        { label: this.t('verrazzano.common.types.matchExpressionOperators.greaterThan'), value: 'Gt' },
      ];
    },
    isValuesSingleElement() {
      let result = false;
      const op = this.getField('operator');

      if (op === 'Gt' || op === 'Lt') {
        result = true;
      }

      return result;
    },
    isValuesMultipleElements() {
      let result = false;
      const op = this.getField('operator');

      if (op === 'In' || op === 'NotIn') {
        result = true;
      }

      return result;
    }
  },
  methods: {
    updateOperator(neu) {
      if (this.isValuesRequirementChanged(this.value.operator, neu)) {
        this.setField('values', []);
      }
      this.setField('operator', neu);
    },
    isValuesRequirementChanged(currentOperator, newOperator) {
      return this.getOperatorValuesType(currentOperator) !== this.getOperatorValuesType(newOperator);
    },
    getOperatorValuesType(op) {
      let opType = null;

      switch (op) {
      case 'In':
      case 'NotIn':
        opType = Array;
        break;

      case 'Gt':
      case 'Lt':
        opType = Number;
        break;

      default:
        break;
      }

      return opType;
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('key')"
        :mode="mode"
        :label="t('verrazzano.common.fields.matchExpressions.key')"
        required
        @input="setField('key', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        :value="getField('operator')"
        :mode="mode"
        :label="t('verrazzano.common.fields.matchExpressions.operator')"
        required
        :options="nodeOperators"
        option-key="value"
        option-label="label"
        @input="updateOperator($event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        v-if="isValuesSingleElement"
        :value="values"
        :mode="mode"
        type="Number"
        :label="t('verrazzano.common.fields.matchExpressions.value')"
        required
        @input="setField('values', [$event])"
      />
      <ArrayList
        v-else-if="isValuesMultipleElements"
        :value="values"
        :mode="mode"
        :label="t('verrazzano.common.fields.matchExpressions.values')"
        initial-empty-row
        required
        @input="setField('values', $event)"
      />
      <span v-else />
    </div>
  </div>
</template>

<style scoped>

</style>
