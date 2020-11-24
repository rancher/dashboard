<script>
import ArrayList from '@/components/form/ArrayList';
import { _VIEW } from '@/config/query-params';
import Select from '@/components/form/Select';

const EFFECT_VALUES = {
  NO_SCHEDULE:        'NoSchedule',
  PREFER_NO_SCHEDULE:  'PreferNoSchedule',
  NO_EXECUTE:         'NoExecute',
};

export default {
  components: { ArrayList, Select },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    }
  },
  data() {
    return { effectOptions: Object.values(EFFECT_VALUES).map(v => ({ label: v, value: v })) };
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
        key:    '',
        value:  '',
        effect: EFFECT_VALUES.NO_SCHEDULE
      };
    }
  }
};
</script>

<template>
  <div class="taints">
    <h4>Taints</h4>
    <ArrayList
      v-model="localValue"
      class="match-kinds-list"
      :protip="false"
      add-label="Add"
      :show-header="true"
      :mode="mode"
      :default-add-value="defaultAddValue"
    >
      <template v-slot:thead-columns>
        <th class="key">
          Key
        </th>
        <th class="value">
          Value
        </th>
        <th class="effect">
          Effect
        </th>
      </template>
      <template v-slot:columns="scope">
        <td class="key">
          <input
            v-model="scope.row.value.key"
            placeholder="e.g. foo"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </td>
        <td class="value">
          <input
            v-model="scope.row.value.value"
            placeholder="e.g. bar"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </td>
        <td class="effect">
          <Select
            v-model="scope.row.value.effect"
            :options="effectOptions"
          />
        </td>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss">
.taints {
  TABLE {
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px 10px;
  }

  TH {
    text-align: left;
    font-size: 10px;
    font-weight: normal;
    color: var(--input-label);
  }

  TD {
    padding-bottom: 10px;
  }
}
</style>
