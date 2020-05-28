<script>
/*
    headerOperations
        - add []
            -name
            -value
        - set []
            -name
            -value
        - remove [] string
*/

import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { LabeledInput },
  props:      {
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    enabled: {
      type:    Boolean,
      default: true
    }
  },
  data() {
    const all = [];

    for (const key in this.spec) {
      this.spec[key].forEach((rule) => {
        all.push({
          op:    key,
          name:  rule.name,
          value: rule.value,
        });
      });
    }

    return { all };
  },
  methods: {
    format() {
      const formatted = {
        add: [], set: [], remove: []
      };

      for (const rule of this.all) {
        formatted[rule.op].push({
          name:  rule.name,
          value: rule.value
        });
      }

      return formatted;
    },
    change() {
      this.$emit('input', this.format());
    },
    addRule(rule) {
      this.all.push({
        op: 'add', name: '', value: ''
      });
    },
    remove( index) {
      this.all.splice(index, 1);
    }
  }
};
</script>

<template>
  <div class="headers" @input="change">
    <table v-if="enabled" class="inputs-table">
      <tr v-if="all.length">
        <th>
          Header Operation
        </th>
        <th>Header Name</th>
        <th>
          Header Value
        </th>
      </tr>
      <tr v-for="(rule, i) in all" :key="i">
        <td>
          <v-select v-model="rule.op" :disabled="!enabled" :serachable="false" class="inline" :options="['add', 'set', 'remove']" />
        </td>
        <td>
          <LabeledInput v-model="rule.name" />
        </td>
        <td>
          <LabeledInput v-model="rule.value" />
        </td>
        <td>
          <button :disabled="!enabled" type="button" class="btn btn-sm role-link" @click="remove(i)">
            REMOVE
          </button>
        </td>
      </tr>
    </table>

    <button :disabled="!enabled" type="button" :class="{disabled: !enabled}" class="btn role-tertiary add" @click="addRule">
      Add Header Operation
    </button>
  </div>
</template>
