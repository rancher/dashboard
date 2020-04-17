<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    // weighted selector terms are nested differently
    isWeighted: {
      type:    Boolean,
      default: false
    },

    // whether or not to show removal 'x' button in upper right (probably shouldn't show if node selectors are required)
    showRemove: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    const ops = [{ label: '<', value: 'Lt' }, { label: '>', value: 'Gt' }, { label: 'is set', value: 'Exists' }, { label: 'is not set', value: 'DoesNotExist' }, { label: 'in list', value: 'In' }, { label: 'not in list', value: 'NotIn' }];

    let rules;

    rules = this.value.matchExpressions || [];

    if (this.isWeighted) {
      rules = this.value?.preference?.matchExpressions || [];
    }

    rules = rules.map((rule) => {
      if (rule.values) {
        rule.values.join(',');
      }

      return rule;
    });

    if (!rules.length) {
      rules.push({ values: '' });
    }

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
    removeRule(idx) {
      this.rules.splice(idx, 1);
      this.update();
    },

    addRule() {
      this.rules.push({ values: '' });
    },

    update() {
      this.$nextTick(() => {
        const matchExpressions = [
          ...this.rules.map((rule) => {
            const matchExpression = { key: rule.key };

            if (rule.operator) {
              matchExpression.operator = rule.operator;
            }
            if (rule.values && rule.operator !== 'Exists' && rule.operator !== 'DoesNotExist') {
              matchExpression.values = (rule.values || []).split(',');
            }

            return matchExpression;
          })];

        let out = { matchExpressions };

        if (this.isWeighted) {
          out = { preference: { matchExpressions }, weight: this.value.weight || 1 };
        }
        this.$emit('input', out);
      });
    }
  }
};
</script>

<template>
  <div :style="{'position':'relative'}" @input="update">
    <button v-if="showRemove" id="remove-btn" class="btn btn-lg role-link">
      <i class="icon icon-lg icon-x" @click="$emit('remove')" />
    </button>
    <div class="rule-row headers">
      <span>Key</span>
      <span>Operator</span>
      <span>Value</span>
    </div>
    <div v-for="(rule, i) in rules" :key="i">
      <div class="rule-row">
        <div class="">
          <LabeledInput v-model="rule.key" :mode="mode" />
        </div>
        <LabeledSelect
          v-model="rule.operator"
          class=""
          :options="ops"
          :mode="mode"
          @input="update"
        />
        <div>
          <LabeledInput v-model="rule.values" :mode="mode" :disabled="rule.operator==='Exists' && rule.operator==='DoesNotExist'" />
        </div>
        <button
          v-if="!isView"
          type="button"
          class="btn btn-sm role-link col remove-rule-button"
          :style="{padding:'0px'}"
          :disabled="mode==='view'"
          @click="removeRule(i)"
        >
          <i class="icon icon-minus icon-lg" />
        </button>
      </div>
    </div>
    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      Add Rule
    </button>
  </div>
</template>

<style lang='scss'>
  #operator {
    & .vs__dropdown-option{
      padding: 3px 6px 3px 6px !important
    }
  }

  #remove-btn{
    padding:  8px;
    position: absolute;
    right:  0px;
    top: 0px;
    & .icon-x {
      transform: scale(1.2)
    }
  }

  .rule-row {
    display:grid;
    grid-template-columns: auto 20% auto 3%;
    grid-column-gap:10px;
    margin-bottom:10px;

    &.headers>* {
      padding:0px 10px 0px 10px;
      color: var(--input-label)
    }

    & .labeled-input INPUT[type='text']:not(.view){
      padding: 9px 0px 9px 0px
    }
  }

  .remove-rule-button{
    justify-content:center;
  }
</style>
