<script>
import { _VIEW } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';
import Select from '@shell/components/form/Select';

const OPERATOR_VALUES = {
  IS_SET:      'Exists',
  IS_NOT_SET:  'DoesNotExist',
  IN_LIST:     'In',
  NOT_IN_LIST: 'NotIn'
};

export default {
  emits: ['update:value', 'input'],

  components: {
    ArrayList,
    LabeledInput,
    Select
  },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    },
    addLabel: {
      type:     String,
      required: true
    }
  },

  data() {
    return {
      operatorOptions: [
        {
          label: 'is set',
          value: OPERATOR_VALUES.IS_SET,
        },
        {
          label: 'is not set',
          value: OPERATOR_VALUES.IS_NOT_SET,
        },
        {
          label: 'in list',
          value: OPERATOR_VALUES.IN_LIST,
        },
        {
          label: 'not in list',
          value: OPERATOR_VALUES.NOT_IN_LIST,
        }
      ],
      optionsWithValueDisabled: [
        OPERATOR_VALUES.IS_SET,
        OPERATOR_VALUES.IS_NOT_SET
      ],
      defaultAddValue: {
        key:      '',
        operator: OPERATOR_VALUES.IS_SET,
      }
    };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('update:value', localValue);
      }
    }
  },

  methods: {
    onOperatorInput(scope, operator) {
      scope.row.value.operator = operator;
      if (this.optionsWithValueDisabled.includes(operator)) {
        if (scope.row.value.values) {
          delete scope.row.value.values;
        }
      } else {
        scope.row.value.values = scope.row.value.values || [];
      }
      scope.queueUpdate();
    },

    isValueDisabled(scope) {
      return this.optionsWithValueDisabled.includes(scope.row.value.operator);
    },
    getValue(scope) {
      return scope.row.value.values?.join(',') || '';
    },
    onValueInput(scope, rawValue) {
      scope.row.value.values = rawValue.split(',')
        .map((entry) => entry.trim());
      scope.queueUpdate();
    }
  },
};
</script>

<template>
  <div
    class="rule-selector"
    :class="{[mode]: true}"
  >
    <ArrayList
      :value="value"
      :protip="false"
      :show-header="true"
      :add-label="addLabel"
      :default-add-value="defaultAddValue"
      :mode="mode"
      @update:value="$emit('input', $event)"
    >
      <template v-slot:column-headers>
        <div class="box">
          <div class="key">
            Key
          </div>
          <div class="operator">
            Operator
          </div>
          <div class="value">
            Value
          </div>
          <div />
        </div>
      </template>
      <template v-slot:columns="scope">
        <div class="key">
          <LabeledInput
            v-model:value="scope.row.value.key"
            :mode="mode"
          />
        </div>
        <div class="operator">
          <Select
            :mode="mode"
            :value="scope.row.value.operator"
            :options="operatorOptions"
            @update:value="onOperatorInput(scope, $event)"
          />
        </div>
        <div class="value">
          <LabeledInput
            :disabled="isValueDisabled(scope)"
            :value="getValue(scope)"
            :mode="mode"
            @update:value="onValueInput(scope, $event)"
          />
        </div>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss" scoped>
.rule-selector {
  &:not(.view) table {
    table-layout: initial;
  }

   :deep() .box {
    display: grid;
    grid-template-columns: 25% 25% 25% 15%;
    column-gap: 1.75%;
    align-items: center;
    margin-bottom: 10px;

    .key,
    .value,
    .operator {
      height: 100%;
    }
  }
}
</style>
