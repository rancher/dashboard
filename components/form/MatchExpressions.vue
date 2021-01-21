<script>
import { NODE, POD, NAMESPACE } from '@/config/types';
import Select from '@/components/form/Select';
import { sortBy } from '@/utils/sort';
import { mapGetters } from 'vuex';
import { removeObject } from '@/utils/array';

export default {
  components: { Select },
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

    const podOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' },
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
    ];

    const nodeOptions = [
      { label: t('workload.scheduling.affinity.matchExpressions.in'), value: 'In' },
      { label: t('workload.scheduling.affinity.matchExpressions.notIn'), value: 'NotIn' },
      { label: t('workload.scheduling.affinity.matchExpressions.lessThan'), value: 'Lt' },
      { label: t('workload.scheduling.affinity.matchExpressions.greaterThan'), value: 'Gt' },
      { label: t('workload.scheduling.affinity.matchExpressions.exists'), value: 'Exists' },
      { label: t('workload.scheduling.affinity.matchExpressions.doesNotExist'), value: 'DoesNotExist' },
    ];

    const ops = this.type === NODE ? nodeOptions : podOptions;

    let rules = [...this.value];

    rules = rules.map((rule) => {
      if (rule.values && typeof rule.values !== 'string') {
        rule.values = rule.values.join(', ');
      }

      return rule;
    });

    if (!rules.length && this.initialEmptyRow) {
      rules.push({
        key:      '',
        operator: 'In',
        values:   ''
      });
    }

    return {
      ops,
      rules,
      custom: []
    };
  },

  computed: {
    // include an empty option for default option 'this pod's namespace
    allNamespaces() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const choices = this.$store.getters[`${ inStore }/all`](NAMESPACE);

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
      removeObject(this.rules, row);
      this.update();
    },

    addRule() {
      this.rules.push({
        key:      '',
        operator: 'In',
        values:   ''
      });
    },

    update() {
      this.$nextTick(() => {
        const out = this.rules.map((rule) => {
          const matchExpression = { key: rule.key, operator: rule.operator };
          let val = (rule.values || '').trim();

          if ( rule.operator === 'Exists' || rule.operator === 'DoesNotExist') {
            val = null;
          } else if (!val) {
            return;
          }

          if ( val !== null ) {
            matchExpression.values = val.split(/\s*,\s*/).filter(x => !!x);
          }

          return matchExpression;
        }).filter(x => !!x);

        this.$emit('input', out);
      });
    }
  }
};
</script>

<template>
  <div @input="update">
    <span v-if="weight && isView" class="selector-weight"><t k="workload.scheduling.affinity.matchExpressions.weight" />: {{ weight }}</span>
    <button v-if="showRemove && !isView" id="remove-btn" class="btn role-link" @click="$emit('remove')">
      <i class="icon icon-x" />
    </button>

    <div v-if="rules.length" class="match-expression-header" :class="{'view':isView}">
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
      v-for="row in rules"
      :key="row.id"
      class="match-expression-row mb-10"
    >
      <div>
        <div v-if="isView">
          {{ row.key }}
        </div>
        <input v-else v-model="row.key" :mode="mode" />
      </div>
      <div>
        <div v-if="isView">
          {{ row.operator }}
        </div>
        <Select
          v-else
          v-model="row.operator"
          class="operator single"
          :options="ops"
          :clearable="false"
          :reduce="opt=>opt.value"
          :mode="mode"
          @input="update"
        />
      </div>

      <div v-if="row.operator==='Exists' || row.operator==='DoesNotExist'" class="no-value">
        <label class="text-muted">&hellip;</label>
      </div>
      <div v-else>
        <div v-if="isView">
          {{ row.values }}
        </div>
        <input v-else v-model="row.values" :mode="mode" :disabled="row.operator==='Exists' || row.operator==='DoesNotExist'" />
      </div>
      <div class="remove-container">
        <button
          v-if="!isView"
          type="button"
          class="btn bg-transparent role-link"
          :style="{padding:'0px'}"

          :disabled="mode==='view'"
          @click="removeRule(row)"
        >
          <t k="generic.remove" />
        </button>
      </div>
    </div>
    <div class="mt-20">
      <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
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

  #remove-btn, .selector-weight{
    padding:  8px;
    position: absolute;
    margin-bottom:10px;
    right: 0px;
    top: 0px;
    z-index: z-index('overContent');
  }

  #remove-btn i {
    font-size:2em;
  }

  .remove-container {
    display: flex;
    justify-content: center;
  }

  .selector-weight {
    color: var(--input-label)
  }

  .match-expression-row, .match-expression-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin: 5px 0;
    grid-gap: 10px;

    & > LABEL {
      margin: 0;
    }

    &:not(.view){
      grid-template-columns: 1fr 1fr 1fr 100px;
    }
  }
</style>
