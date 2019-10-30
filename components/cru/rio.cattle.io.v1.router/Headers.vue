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
  computed: {
    formatted() {
      const formatted = {
        add:    [], set:    [], remove: []
      };

      for (const rule of this.all) {
        formatted[rule.op].push({
          name:  rule.name,
          value: rule.value
        });
      }

      return formatted;
    },
  },
  methods: {
    change() {
      this.$emit('input', this.formatted);
    },
    addRule(rule) {
      this.all.push({
        op:    'add', name:  '', value: ''
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
    <template v-if="enabled">
      <div v-for="(rule, i) in all" :key="i" class="row inputs">
        <v-select v-model="rule.op" class="inline" :options="['add', 'set', 'remove']" />
        <LabeledInput v-model="rule.name" label="Header Name" />
        <LabeledInput v-model="rule.value" label="Header Value" />
        <button class="btn btn-sm role-link" @click="remove(i)">
          REMOVE
        </button>
      </div>
    </template>

    <button :class="{disabled: !enabled}" class="btn bg-primary btn-sm" @click="addRule">
      add header operation
    </button>
  </div>
</template>
