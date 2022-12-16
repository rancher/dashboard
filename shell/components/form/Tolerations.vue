<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { _VIEW } from '@shell/config/query-params';
import { random32 } from '@shell/utils/string';

export default {
  components: {
    LabeledInput,
    Select,
    // SortableTable,
    UnitInput
  },
  props: {
    // pod tolerations array
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
    return { rules: [...this.value] };
  },

  computed: {
    tableHeaders() {
      return [
        {
          name:  'key',
          label: this.t('workload.scheduling.tolerations.labelKey'),
          value: 'key'
        },
        {
          name:  'operator',
          label: this.t('workload.scheduling.tolerations.operator'),
          value: 'operator',
          width: '10%'
        },
        {
          name:  'value',
          label: this.t('workload.scheduling.tolerations.value'),
          value: 'value'
        },
        {
          name:  'effect',
          label: this.t('workload.scheduling.tolerations.effect'),
          value: 'effect',
          width: '20%'
        },
        {
          name:  'seconds',
          label: this.t('workload.scheduling.tolerations.tolerationSeconds'),
          value: 'tolerationSeconds',
          width: '20%'
        },
        {
          name:  'remove',
          width: '50'
        }
      ];
    },
    operatorOpts() {
      return [
        {
          label: this.t('workload.scheduling.tolerations.operatorOptions.exists'),
          value: 'Exists'
        },
        {
          label: this.t('workload.scheduling.tolerations.operatorOptions.equal'),
          value: 'Equal'
        }
      ];
    },
    effectOpts() {
      return [
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.all'),
          value: 'All'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.noSchedule'),
          value: 'NoSchedule'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.preferNoSchedule'),
          value: 'PreferNoSchedule'
        },
        {
          label: this.t('workload.scheduling.tolerations.effectOptions.noExecute'),
          value: 'NoExecute'
        }
      ];
    },

    isView() {
      return this.mode === _VIEW;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    remove(row) {
      const idx = this.rules.indexOf(row);

      this.rules.splice(idx, 1);
      this.update();
    },

    update() {
      this.$emit('input', this.rules);
    },

    addToleration() {
      this.rules.push({ vKey: random32() });
    },

    updateEffect(neu, rule) {
      if (neu !== 'NoExecute' && rule.tolerationSeconds) {
        delete rule.tolerationSeconds;
      }
    }
  }

};
</script>

<template>
  <div class="tolerations">
    <div
      v-if="rules.length"
      class="toleration-headers"
    >
      <span>{{ t('workload.scheduling.tolerations.labelKey') }}</span>
      <span>{{ t('workload.scheduling.tolerations.operator') }}</span>
      <span>{{ t('workload.scheduling.tolerations.value') }}</span>
      <span>{{ t('workload.scheduling.tolerations.effect') }}</span>
      <span>{{ t('workload.scheduling.tolerations.tolerationSeconds') }}</span>
      <span />
    </div>
    <div
      v-for="rule in rules"
      :key="rule.vKey"
      class="rule"
    >
      <div class="col">
        <LabeledInput
          v-model="rule.key"
          :mode="mode"
        />
      </div>
      <div class="col">
        <Select
          id="operator"
          v-model="rule.operator"
          :options="operatorOpts"
          :mode="mode"
          @input="update"
        />
      </div>
      <template v-if="rule.operator==='Exists'">
        <div class="col">
          <LabeledInput
            value="n/a"
            :mode="mode"
            disabled
          />
        </div>
      </template>
      <template v-else>
        <div class="col">
          <LabeledInput
            v-model="rule.value"
            :mode="mode"
          />
        </div>
      </template>
      <div class="col">
        <Select
          v-model="rule.effect"
          :options="effectOpts"
          :mode="mode"
          @input="e=>updateEffect(e, rule)"
        />
      </div>
      <div class="col">
        <UnitInput
          v-model="rule.tolerationSeconds"
          :disabled="rule.effect !== 'NoExecute'"
          :mode="mode"
          suffix="Seconds"
        />
      </div>
      <div class="col">
        <button
          v-if="!isView"
          type="button"
          class="btn role-link"
          :disabled="mode==='view'"
          @click="remove(rule)"
        >
          <t k="generic.remove" />
        </button>
      </div>
    </div>
    <button
      v-if="!isView"
      type="button"
      class="btn role-tertiary"
      @click="addToleration"
    >
      <t k="workload.scheduling.tolerations.addToleration" />
    </button>
  </div>
</template>

<style lang='scss' scoped>
.tolerations{
  width: 100%;
}

.rule, .toleration-headers{
  display: grid;
  grid-template-columns: 20% 10% 20% 15% 20% 10%;
  grid-gap: $column-gutter;
  align-items: center;
}

.rule {
  margin-bottom: 20px;
  .col {
    height: 100%;
  }
}

.toleration-headers SPAN {
  color: var(--input-label);
  margin-bottom: 10px;
}
</style>
