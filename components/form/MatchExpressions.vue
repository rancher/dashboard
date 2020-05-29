<script>
import { NODE } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    // array of match expressions
    value: {
      type:     Array,
      required: true
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    // pod/node affinity types have different operator options
    type: {
      type:     String,
      required: true
    },

    // whether or not to show an initial empty row of inputs when value is empty in editing modes
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },

    // whether or not to show remove button in upper right
    showRemove: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    const podOptions = [
      { label: t('workload.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
      { label: t('workload.matchExpressions.in'), value: 'In' },
      { label: t('workload.matchExpressions.notIn'), value: 'NotIn' }];

    const nodeOptions = [
      { label: t('workload.matchExpressions.lessThan'), value: 'Lt' },
      { label: t('workload.matchExpressions.greaterThan'), value: 'Gt' },
      { label: t('workload.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
      { label: t('workload.matchExpressions.in'), value: 'In' },
      { label: t('workload.matchExpressions.notIn'), value: 'NotIn' }];

    const ops = this.type === NODE ? nodeOptions : podOptions;

    let rules = this.value;

    rules = rules.map((rule) => {
      if (rule.values) {
        rule.values.join(',');
      }

      return rule;
    });

    if (!rules.length && this.initialEmptyRow) {
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
        const out = [
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

        this.$emit('input', out);
      });
    }
  }
};
</script>

<template>
  <div :style="{'position':'relative'}" @input="update">
    <button v-if="showRemove && !isView" id="remove-btn" class="btn btn-sm role-link" @click="$emit('remove')">
      <t k="buttons.remove" />
    </button>
    <div class="rule-row headers">
      <t k="workload.matchExpressions.key" />
      <t k="workload.matchExpressions.operator" />
      <t k="workload.matchExpressions.value" />
    </div>
    <t v-if="!rules.length && isView" class="no-rows" k="sortableTable.noRows" />
    <div v-for="(rule, i) in rules" v-else :key="i">
      <div class="rule-row">
        <div class="">
          <LabeledInput v-model="rule.key" :mode="mode" />
        </div>
        <LabeledSelect
          id="operator"
          v-model="rule.operator"
          :options="ops"
          :mode="mode"
          @input="update"
        />
        <div v-if="rule.operator==='Exists' || rule.operator==='DoesNotExist'" class="no-value">
          <label>n/a</label>
        </div>
        <div v-else>
          <LabeledInput v-model="rule.values" :mode="mode" :disabled="rule.operator==='Exists' || rule.operator==='DoesNotExist'" />
        </div>
        <button
          v-if="!isView"
          type="button"
          class="btn role-link col remove-rule-button"
          :style="{padding:'0px'}"
          :disabled="mode==='view'"
          @click="removeRule(i)"
        >
          <i class="icon icon-minus" />
        </button>
      </div>
    </div>
    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      <t k="workload.matchExpressions.addRule" />
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

    .no-rows{
        text-align: center;
        display: block;
    }

  .rule-row {
    display:grid;
    grid-template-columns: 35% 20% 35% 5%;
    grid-column-gap:10px;
    margin-bottom:10px;
    & .no-value{
        align-self:center;
        margin-left:10px
    }

    &.headers>* {
      padding:0px 10px 0px 10px;
      color: var(--input-label)
    }

    & .labeled-input INPUT[type='text']:not(.view){
      padding: 9px 0px 9px 0px
    }
  }

  .remove-rule-button{
    align-self:center;
  }
</style>
