<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:    Array,
      default: () => []
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },
  data() {
    const ops = [{ label: '=', value: '=' }, { label: '<', value: 'lt' }, { label: '>', value: 'gt' }, { label: '≠', value: 'notin' }, { label: 'is set', value: ' ' }, { label: 'is not set', value: '!' }, { label: 'in list', value: 'in' }, { label: 'not in list', value: 'notin' }];
    const rules = this.value.map(rule => rule.matchExpressions[0]);

    return {
      ops, rules, custom: []
    };
  },
  computed: {
    isView() {
      return this.mode === 'view';
    }
  },
  methods: {
    parseRuleString(rule) {
      const all = rule.split(' ');
      let key; let op; let value;

      if (all[0].length) {
        if (all.length > 1) {
          key = all[0];
          op = all[1];
          value = all[2].startsWith('(') ? all[2].slice(1, all[2].length - 1) : all[2];
        } else if (all[0].startsWith('!')) {
          op = '!';
          key = all[0].slice(1);

          return { key, op };
        } else {
          key = all[0];
          op = ' ';

          return { key, op };
        }

        return {
          key, op, value
        };
      }
    },

    removeRule(idx) {
      this.rules.splice(idx, 1);
    },

    removeCustom(idx) {
      this.custom.splice(idx, 1);
    },

    addRule() {
      this.rules.push({ values: [] });
    },

    addCustomRule() {
      this.custom.push('');
    },

    updateCustom(idx, rule) {
      this.$set(this.custom, idx, rule);
    },

    update() {
      // const out = this.rules.map((rule) => {
      //   if (!rule.key) {
      //     return;
      //   }
      //   if (rule.op === ' ' || rule.op === '!') {
      //     return `${ rule.op }${ rule.key }`.trim();
      //   } else if (rule.op === 'in' || rule.op === 'notin') {
      //     return `${ rule.key } ${ rule.op } (${ rule.value.trim() })`;
      //   } else {
      //     return `${ rule.key } ${ rule.op } ${ rule.value }`;
      //   }
      // }).filter(rule => rule);

      const out = [
        ...this.rules.map((rule) => {
          return {
            key:      rule.key,
            operator: rule.operator,
            values:   [rule.value]
          };
        }),
        ...this.custom.map((rule) => {
          return {
            key:      rule,
            operator: 'exists'
          };
        })];

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div @input="update">
    <div v-for="(rule, i) in rules" :key="i">
      <div class="row">
        <div class="col span-4">
          <LabeledInput v-model="rule.key" label="Key" :mode="mode" />
        </div>
        <LabeledSelect v-model="rule.operator" class="col span-2" :options="ops" :mode="mode" @input="update" />
        <div class="col span-4">
          <LabeledInput v-model="rule.values[0]" label="Value" :disabled="rule.op===' '||rule.op==='!'" :mode="mode" />
        </div>
        <button
          v-if="!isView"
          type="button"
          class="btn btn-sm role-link"
          :style="{padding:'0px'}"
          :disabled="mode==='view'"
          @click="removeRule(i)"
        >
          REMOVE
        </button>
      </div>
    </div>
    <div v-for="(rule, i) in custom" :key="i" class="row">
      <div class="col span-10">
        <LabeledInput :multiline="false" :value="rule" placeholder="e.g. foo > 42 && bar != baz" :mode="mode" @input="e=>updateCustom(i, e)" />
      </div>
      <button
        v-if="!isView"
        type="button"
        class="btn btn-sm role-link"
        :style="{padding:'0px'}"
        :disabled="mode==='view'"
        @click="removeCustom(i)"
      >
        REMOVE
      </button>
    </div>
    <button v-if="!isView" type="button" class="btn btn-sm role-primary" :disabled="mode==='view'" @click="addRule">
      ADD RULE
    </button>
    <button v-if="!isView" type="button" class="btn btn-sm role-secondary" :disabled="mode==='view'" @click="addCustomRule">
      Add custom rule
    </button>
  </div>
</template>
