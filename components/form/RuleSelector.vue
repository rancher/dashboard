<script>
import { _VIEW } from '@/config/query-params';
import ArrayList from '@/components/form/ArrayList';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

const OPERATOR_VALUES = {
  IS_SET:      'Exists',
  IS_NOT_SET:  'DoesNotExist',
  IN_LIST:     'In',
  NOT_IN_LIST: 'NotIn'
};

export default {
  components: {
    ArrayList,
    LabeledInput,
    LabeledSelect
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
      ]
    };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('input', localValue);
      }
    },
    defaultAddValue() {
      return {
        key:      '',
        operator: OPERATOR_VALUES.IS_SET,
      };
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
        .map(entry => entry.trim());
      scope.queueUpdate();
    }
  },
};
</script>

<template>
  <div class="rule-selector" :class="{[mode]: true}">
    <ArrayList
      v-model="localValue"
      :protip="false"
      :show-header="true"
      :add-label="addLabel"
      :default-add-value="defaultAddValue"
      :mode="mode"
    >
      <template v-slot:thead-columns>
        <th>Key</th>
        <th>Operator</th>
        <th>Value</th>
        <th></th>
      </template>
      <template v-slot:columns="scope">
        <td class="key">
          <LabeledInput v-model="scope.row.value.key" :mode="mode" @input="scope.queueUpdate" />
        </td>
        <td class="operator">
          <LabeledSelect
            style="height: 100%;"
            :mode="mode"
            :value="scope.row.value.operator"
            :options="operatorOptions"
            @input="onOperatorInput(scope, $event)"
          />
        </td>
        <td class="value">
          <LabeledInput :disabled="isValueDisabled(scope)" :value="getValue(scope)" :mode="mode" @input="onValueInput(scope, $event)" />
        </td>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss">
.rule-selector {
  &:not(.view) table {
    table-layout: initial;
  }
  table {
    .key, .value {
      input {
        height: 33px;
      }
    }

    .operator {
      .vs__dropdown-toggle {
        height: 59px;
      }
      width: 100px;
    }

    .vs--open {
      .vs__dropdown-toggle {
        padding: 18px 0;
      }

      .labeled-input {
        display: none;
      }
    }

    .vs__dropdown-toggle {
      padding: 3px 0;
    }
  }
}
</style>
