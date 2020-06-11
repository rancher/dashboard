<script>
import { NODE, POD, NAMESPACE } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import SortableTable from '@/components/SortableTable';
import { sortBy } from '@/utils/sort';
import ArrayList from '@/components/form/ArrayList';
import { mapGetters } from 'vuex';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    SortableTable,
    ArrayList
  },
  props:      {
    // array of match expressions
    value: {
      type:     Array,
      default: () => []
    },

    namespaces: {
      type:    Array,
      default: null
    },

    topologyKey: {
      type:    String,
      default: null
    },

    // show selector weight (if present) in view mode
    weight: {
      type:    Number,
      default: null
    },

    // CRU mode
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
        label: t('workload.scheduling.affinity.matchExpressions.key'),
        value: 'key'
      },
      {
        name:  'operator',
        label: t('workload.scheduling.affinity.matchExpressions.operator'),
        value: 'operator',
        width: '20%'
      },
      {
        name:  'value',
        label: t('workload.scheduling.affinity.matchExpressions.value'),
        value: 'values'
      },
    ];

    if (this.showRemove) {
      tableHeaders.push({
        name:          'remove',
        label:         '',
        value:         '',
        width:         50
      });
    }

    const podOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' }];

    const nodeOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.lessThan'), value: 'Lt' },
      { label: t('workload.scheduling.affinity.matchExpressions.greaterThan'), value: 'Gt' },
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' }];

    const ops = this.type === NODE ? nodeOptions : podOptions;

    let rules = [...this.value];

    rules = rules.map((rule) => {
      if (rule.values && typeof rule.values !== 'string') {
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
    // include an empty option for default option 'this pod's namespace
    allNamespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      const out = sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');

      out.unshift({ label: this.t('workload.scheduling.affinity.thisPodNamespace'), value: null });

      return out;
    },

    isView() {
      return this.mode === 'view';
    },

    node() {
      return NODE;
    },

    pod() {
      return POD;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    removeRule(row) {
      const idx = this.rules.indexOf(row);

      this.rules.splice(idx, 1);
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
    <span v-if="weight && isView" class="selector-weight"><t k="workload.scheduling.affinity.matchExpressions.weight" />: {{ weight }}</span>
    <button v-if="showRemove && !isView" id="remove-btn" class="btn role-link" @click="$emit('remove')">
      <i class="icon icon-x" />
    </button>

    <template v-if="type===pod">
      <div class="row mt-20">
        <div class="col span-12">
          <ArrayList :protip="false" :title="t('workload.scheduling.affinity.matchExpressions.inNamespaces')" :mode="mode" :value="namespaces" @input="e=>$emit('update:namespaces', e)">
            <template #value="props">
              <LabeledSelect
                v-model="props.row.value"
                :mode="mode"
                :options="allNamespaces"
                :label="!isView ? 'Namespaces' :''"
                :multiple="false"
                @input="props.queueUpdate"
              />
            </template>
          </ArrayList>
        </div>
      </div>
      <div class="row">
        <div class="col span-12">
          <LabeledInput
            :mode="mode"
            :value="topologyKey"
            required
            :label="t('workload.scheduling.affinity.topologyKey.label')"
            :placeholder="t('workload.scheduling.affinity.topologyKey.placeholder')"
            @input="e=>$emit('update:topologyKey', e)"
          />
        </div>
      </div>
    </template>

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
            class="btn btn-sm role-link col remove-rule-button"
            :style="{padding:'0px'}"

            :disabled="mode==='view'"
            @click="removeRule(row)"
          >
            <t k="buttons.remove" />
          </button>
        </td>
      </template>
    </SortableTable>
    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      <t k="workload.scheduling.affinity.matchExpressions.addRule" />
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

  #remove-btn, .selector-weight{
    padding:  8px;
    position: absolute;
    margin-bottom:10px;
    right:  0px;
    top: 0px;
    z-index: z-index('overContent');
  }

  #remove-btn i {
    font-size:2em;
  }

  .selector-weight {
    color: var(--input-label)
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
