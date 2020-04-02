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
    },

    isWeighted: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const ops = [{ label: '<', value: 'Lt' }, { label: '>', value: 'Gt' }, { label: 'is set', value: 'Exists' }, { label: 'is not set', value: 'DoesNotExist' }, { label: 'in list', value: 'In' }, { label: 'not in list', value: 'NotIn' }];

    // if node affinity has weighted rules, the matchExpressions are nested further in 'preference' field
    const rules = this.isWeighted ? this.value.map((rule) => {
      return { ...rule.preference.matchExpressions[0], weight: rule.weight };
    })
      : this.value.map(rule => rule.matchExpressions[0]);

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
      this.update();
    },

    removeCustom(idx) {
      this.custom.splice(idx, 1);
      this.update();
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
      this.$nextTick(() => {
        const out = [
          ...this.rules.map((rule) => {
            const matchExpression = { key: rule.key };

            if (rule.operator) {
              matchExpression.operator = rule.operator;
            }
            if (rule.values.length && rule.operator !== 'Exists' && rule.operator !== 'DoesNotExist') {
              matchExpression.values = rule.values;
            }

            return matchExpression;
          }),
          ...this.custom.map((rule) => {
            return {
              key:      rule,
              operator: 'Exists'
            };
          })];

        this.$emit('input', out);
      });
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
        <LabeledSelect
          id="operator"
          v-model="rule.operator"
          class="col span-2"
          :options="ops"
          :mode="mode"
          label="Op"
          @input="update"
        />
        <!-- use conditional rendering here to avoid this v-model breaking the page if rule.values doesn't exist -->
        <div v-if="rule.operator!=='Exists'&&rule.operator!=='DoesNotExist'" class="col span-4">
          <LabeledInput v-model="rule.values[0]" label="Value" :mode="mode" />
        </div>
        <div v-if="isWeighted" class="col span-2">
          <LabeledInput v-model="rule.weight" label="Weight" :mode="mode" />
        </div>
        <button
          v-if="!isView"
          type="button"
          class="btn btn-sm role-link"
          :style="{padding:'0px'}"
          :disabled="mode==='view'"
          @click="removeRule(i)"
        >
          <!-- REMOVE -->
          <i class="icon icon-minus icon-lg" />
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
        <!-- REMOVE -->
        <i class="icon icon-minus icon-lg" />
      </button>
    </div>
    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      Add Rule
    </button>
    <!-- <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addCustomRule">
      Add custom rule
    </button> -->
  </div>
</template>

<style lang='scss'>
  #operator {
    & .vs__dropdown-option{
      padding: 3px 6px 3px 6px !important
    }
  }
</style>
