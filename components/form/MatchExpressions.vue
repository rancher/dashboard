<script>
import { NODE } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import SortableTable from '@/components/SortableTable';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    SortableTable
  },
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

    const tableHeaders = [
      {
        name:  'key',
        label: t('workload.matchExpressions.key'),
        value: 'key'
      },
      {
        name:  'operator',
        label: t('workload.matchExpressions.operator'),
        value: 'operator',
        width: '20%'
      },
      {
        name:  'value',
        label: t('workload.matchExpressions.value'),
        value: 'values'
      },
    ];

    if (this.showRemove) {
      tableHeaders.push({
        name:          'remove',
        label:         '',
        value:         '',
        width:         25
      });
    }

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
        rule.values = rule.values.join(',');
      }

      return rule;
    });

    if (!rules.length && this.initialEmptyRow) {
      rules.push({ values: '' });
    }

    return {
      ops, rules, custom: [], tableHeaders
    };
  },

  computed: {
    isView() {
      return this.mode === 'view';
    }
  },

  methods: {
    removeRule(row) {
      const idx = this.rules.indexOf(row);

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
            if (rule.values) {
              if ((rule.operator === 'In' || rule.operator === 'NotIn')) {
                matchExpression.values = (rule.values || []).split(',');
              } else {
                matchExpression.values = [rule.values];
              }
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
    <SortableTable
      class="match-expressions"
      :class="mode"
      :headers="tableHeaders"
      :rows="rules"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      :show-no-rows="isView"
      key-field="id"
    >
      <template #col:key="{row}">
        <td class="key">
          <LabeledInput v-model="row.key" :mode="mode" />
        </td>
      </template>
      <template #col:operator="{row}">
        <td>
          <LabeledSelect
            id="operator"
            v-model="row.operator"
            :options="ops"
            :mode="mode"
            @input="update"
          />
        </td>
      </template>
      <template #col:value="{row}">
        <td v-if="row.operator==='Exists' || row.operator==='DoesNotExist'" class="no-value">
          <label>n/a</label>
        </td>
        <td v-else>
          <LabeledInput v-model="row.values" :mode="mode" :disabled="row.operator==='Exists' || row.operator==='DoesNotExist'" />
        </td>
      </template>
      <template #col:remove="{row}">
        <td>
          <button
            v-if="!isView"
            type="button"
            class="btn role-link col remove-rule-button"
            :style="{padding:'0px'}"

            :disabled="mode==='view'"
            @click="removeRule(row)"
          >
            <i class="icon icon-minus" />
          </button>
        </td>
      </template>
    </SortableTable>
    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      <t k="workload.matchExpressions.addRule" />
    </button>
  </div>
</template>

<style lang='scss'>
  $separator: 20;
  $remove: 75;
  $spacing: 10px;

  #operator {
    & .vs__dropdown-option{
      padding: 3px 6px 3px 6px !important
    }
  }

  #remove-btn{
    padding:  8px;
    position: absolute;
    margin-bottom:10px;
    right:  0px;
    top: 0px;
    z-index: z-index('overContent');
  }

  .match-expressions {
    & TABLE.sortable-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: $spacing;

    TD, TH {
      padding-right: $spacing;
      padding-bottom: $spacing;

      &:last-of-type {
        padding-right: 0;
      }
    }

    TR:first-of-type TD {
      padding-top: $spacing;
    }

    TR:last-of-type TD {
      padding-bottom: 0;
    }

    & .remove-rule-button{
      padding-left:0px;
        vertical-align: middle;
        text-align: right;
        width: #{$remove}px;
      }
    }
    &.edit, &.create, &.clone {
      TABLE.sortable-table THEAD TR TH {
        border-color: transparent;
    }
  }
  }
</style>
