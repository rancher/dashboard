<script>
import { _VIEW } from '@/config/query-params';
import ArrayList from '@/components/form/ArrayList';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

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
    operatorOptions: {
      type:    Array,
      default: null
    },
    keyHeader: {
      type:     String,
      required: true
    },
    operatorHeader: {
      type:     String,
      required: true
    },
    valueHeader: {
      type:     String,
      required: true
    },
    addLabel: {
      type:     String,
      required: true
    }
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
        operator: this.operatorOptions[0].value,
        values:    []
      };
    }
  },

  methods: {}
};
</script>

<template>
  <div class="rule-selector">
    <ArrayList
      v-model="localValue"
      :protip="false"
      :show-header="true"
      :add-label="addLabel"
      :default-add-value="defaultAddValue"
      :mode="mode"
    >
      <template v-slot:columns>
        <th>{{ keyHeader }}</th>
        <th>{{ operatorHeader }}</th>
        <th>{{ valueHeader }}</th>
      </template>
      <template v-slot:columns="scope">
        <td>
          <LabeledInput v-model="scope.row.value.key" :mode="mode" @input="scope.queueUpdate" />
        </td>
        <td>
          <LabeledSelect
            style="height: 100%;"
            :mode="mode"
            :value="scope.row.value.operator"
            :options="operatorOptions"
            @input="scope.row.value.operator = $event; scope.queueUpdate()"
          />
        </td>
        <td>
          <LabeledInput :value="scope.row.value.values.join(',')" :mode="mode" @input="scope.row.value.values = $event.split(','); scope.queueUpdate()" />
        </td>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss">
.rule-selector .fixed {
  input {
    height: initial;
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
</style>
