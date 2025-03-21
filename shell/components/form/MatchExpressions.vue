<script>
import { NODE, POD } from '@shell/config/types';
import Select from '@shell/components/form/Select';
import { mapGetters } from 'vuex';
import { isArray, removeObject } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { convert, simplify } from '@shell/utils/selector';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  emits: ['update:value', 'remove'],

  components: { Select, LabeledSelect },
  props:      {
    // Array of actual match expressions
    // or k8s selector Object of {matchExpressions, matchLabels}
    value: {
      type:    [Array, Object],
      default: () => []
    },

    // CRU mode
    mode: {
      type:    String,
      default: 'edit'
    },

    // pod/node affinity types have different operator options
    type: {
      type:    String,
      default: NODE
    },

    // has select for matching fields or expressions (used for node affinity)
    // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#nodeselectorterm-v1-core
    matchingSelectorDisplay: {
      type:    Boolean,
      default: false,
    },

    // whether or not to show an initial empty row of inputs when value is empty in editing modes
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },

    // whether or not to show add rule button at bottom
    showAddButton: {
      type:    Boolean,
      default: true
    },

    // whether or not to show remove rule button right side of the rule
    showRemoveButton: {
      type:    Boolean,
      default: true
    },

    // whether or not to show remove button in upper right
    showRemove: {
      type:    Boolean,
      default: true
    },

    // if options are passed for keys, then the key's input will become a select
    keysSelectOptions: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    const podOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' },
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
    ];

    const nodeOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' },
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
      { label: t('workload.scheduling.affinity.matchExpressions.lessThan'), value: 'Lt' },
      { label: t('workload.scheduling.affinity.matchExpressions.greaterThan'), value: 'Gt' },
    ];

    const ops = this.type === NODE ? nodeOptions : podOptions;

    let rules;

    // special case for matchFields and matchExpressions
    // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#nodeselectorterm-v1-core
    if ( this.matchingSelectorDisplay) {
      const rulesByType = {
        matchFields:      [],
        matchExpressions: []
      };

      ['matchFields', 'matchExpressions'].forEach((type) => {
        rulesByType[type] = this.parseRules(this.value[type], type);
      });

      rules = [...rulesByType.matchFields, ...rulesByType.matchExpressions];
    } else if ( isArray(this.value) ) {
      rules = [...this.value];
      rules = this.parseRules(rules);
    } else {
      rules = convert(this.value.matchLabels, this.value.matchExpressions);
      rules = this.parseRules(rules);
    }

    if (!rules.length && this.initialEmptyRow && !this.isView) {
      const newRule = {
        key:      '',
        operator: 'In',
        values:   ''
      };

      if (this.matchingSelectorDisplay) {
        newRule.matching = 'matchExpressions';
      }

      rules.push(newRule);
    }

    return {
      ops,
      rules,
      custom: []
    };
  },

  computed: {
    isView() {
      return this.mode === 'view';
    },

    node() {
      return NODE;
    },

    pod() {
      return POD;
    },

    hasKeySelectOptions() {
      return !!this.keysSelectOptions?.length;
    },

    matchingSelectOptions() {
      return [
        {
          label: this.t('workload.scheduling.affinity.matchExpressions.label'),
          value: 'matchExpressions',
        },
        {
          label: this.t('workload.scheduling.affinity.matchFields.label'),
          value: 'matchFields',
        },
      ];
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    parseRules(rules, matching) {
      if (rules?.length) {
        return rules.map((rule) => {
          const newRule = clone(rule);

          if (newRule.values && typeof newRule.values !== 'string') {
            newRule.values = newRule.values.join(', ');
          }

          if (matching) {
            newRule.matching = matching;
          }

          return newRule;
        });
      }

      return [];
    },

    removeRule(row) {
      removeObject(this.rules, row);
      this.update();
    },

    addRule() {
      const newRule = {
        key:      '',
        operator: 'In',
        values:   ''
      };

      if (this.matchingSelectorDisplay) {
        newRule.matching = 'matchExpressions';
      }

      this.rules.push(newRule);
    },

    update() {
      this.$nextTick(() => {
        const out = this.rules.map((rule) => {
          const expression = { key: rule.key, operator: rule.operator };

          if (this.matchingSelectorDisplay) {
            expression.matching = rule.matching;
          }

          let val = (rule.values || '').trim();

          if ( rule.operator === 'Exists' || rule.operator === 'DoesNotExist') {
            val = null;
          }

          if ( val !== null ) {
            expression.values = val.split(/\s*,\s*/);
          }

          return expression;
        }).filter((x) => !!x);

        if ( isArray(this.value) || this.matchingSelectorDisplay ) {
          this.$emit('update:value', out);
        } else {
          this.$emit('update:value', simplify(out));
        }
      });
    }
  }
};
</script>

<template>
  <div>
    <slot
      v-if="rules.length"
      name="header"
    />
    <button
      v-if="showRemove && !isView"
      type="button"
      class="btn role-link remove-expression"
      @click="$emit('remove')"
    >
      <i class="icon icon-x" />
    </button>

    <div
      v-if="rules.length"
      class="match-expression-header"
      :class="{ 'view':isView, 'match-expression-header-matching': matchingSelectorDisplay }"
    >
      <label v-if="matchingSelectorDisplay">
        {{ t('workload.scheduling.affinity.matchExpressions.matchType') }}
      </label>
      <label>
        {{ t('workload.scheduling.affinity.matchExpressions.key') }}
      </label>
      <label>
        {{ t('workload.scheduling.affinity.matchExpressions.operator') }}
      </label>
      <label>
        {{ t('workload.scheduling.affinity.matchExpressions.value') }}
      </label>
      <span />
    </div>
    <div
      v-for="(row, index) in rules"
      :key="index"
      class="match-expression-row"
      :class="{'view':isView, 'mb-10': index !== rules.length - 1, 'match-expression-row-matching': matchingSelectorDisplay}"
    >
      <!-- Select for matchFields and matchExpressions -->
      <div
        v-if="matchingSelectorDisplay"
        :data-testid="`input-match-type-field-${index}`"
      >
        <div v-if="isView">
          {{ row.matching }}
        </div>
        <LabeledSelect
          v-else
          v-model:value="row.matching"
          :mode="mode"
          :options="matchingSelectOptions"
          :data-testid="`input-match-type-field-control-${index}`"
          @selecting="update"
        />
      </div>
      <div
        :data-testid="`input-match-expression-key-${index}`"
      >
        <div v-if="isView">
          {{ row.key }}
        </div>
        <input
          v-else-if="!hasKeySelectOptions"
          v-model="row.key"
          :mode="mode"
          :data-testid="`input-match-expression-key-control-${index}`"
          @input="update"
        >
        <LabeledSelect
          v-else
          v-model:value="row.key"
          :mode="mode"
          :options="keysSelectOptions"
          :data-testid="`input-match-expression-key-control-select-${index}`"
        />
      </div>
      <div
        :data-testid="`input-match-expression-operator-${index}`"
      >
        <div v-if="isView">
          {{ row.operator }}
        </div>
        <Select
          v-else
          v-model:value="row.operator"
          class="operator single"
          :options="ops"
          :clearable="false"
          :reduce="opt=>opt.value"
          :mode="mode"
          :data-testid="`input-match-expression-operator-control-${index}`"
          @update:value="update"
        />
      </div>

      <div
        v-if="row.operator==='Exists' || row.operator==='DoesNotExist'"
        class="no-value"
      >
        <label class="text-muted">&hellip;</label>
      </div>
      <div
        v-else
        :data-testid="`input-match-expression-values-${index}`"
      >
        <div v-if="isView">
          {{ row.values }}
        </div>
        <input
          v-else
          v-model="row.values"
          :mode="mode"
          :disabled="row.operator==='Exists' || row.operator==='DoesNotExist'"
          :data-testid="`input-match-expression-values-control-${index}`"
          @input="update"
        >
      </div>
      <div
        v-if="showRemoveButton"
        class="remove-container"
      >
        <button
          v-if="!isView"
          type="button"
          class="btn role-link"
          :style="{padding:'0px'}"

          :disabled="mode==='view'"
          :data-testid="`input-match-expression-remove-control-${index}`"
          @click="removeRule(row)"
        >
          <t k="generic.remove" />
        </button>
      </div>
    </div>
    <div
      v-if="!isView && showAddButton"
      class="mt-20"
    >
      <button
        type="button"
        class="btn role-tertiary add"
        :data-testid="`input-match-expression-add-rule`"
        @click="addRule"
      >
        <t k="workload.scheduling.affinity.matchExpressions.addRule" />
      </button>
    </div>
  </div>
</template>

<style lang='scss' scoped>
  $separator: 20;
  $remove: 75;
  $spacing: 10px;

  .operator {
    & .vs__dropdown-option{
      padding: 3px 6px 3px 6px !important
    }
  }

  .remove-expression {
    padding:  8px;
    position: absolute;
    margin-bottom:10px;
    right: 0px;
    top: 0px;
    z-index: z-index('overContent');

    i {
      font-size:2em;
    }
  }

  .remove-container {
    display: flex;
    justify-content: center;
  }

  .match-expression-row, .match-expression-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin: 5px 0;
    grid-gap: $column-gutter;

    & > LABEL {
      margin: 0;
    }

    &:not(.view){
      grid-template-columns: repeat(3, 1fr) 50px;
    }
  }

  .match-expression-row > div > input {
    min-height: 40px !important;
  }
  .match-expression-row-matching, .match-expression-header-matching {
    grid-template-columns: 1fr 1fr 1fr 1fr;

    &:not(.view){
      grid-template-columns: 1fr 1fr 1fr 1fr 100px;
    }
  }
</style>
