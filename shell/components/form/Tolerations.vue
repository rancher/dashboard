<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { _VIEW } from '@shell/config/query-params';
import { random32 } from '@shell/utils/string';

export default {
  emits: ['update:value'],

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
    const rules = [];

    // on creation in agent configuration, the backend "eats"
    // the empty "effect" string, which doesn't happen on edit
    // just to make sure we populate it correcty, let's consider
    // no prop "effect" as an empty string which means all
    // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#toleration-v1-core
    if (this.value.length) {
      this.value.forEach((v) => {
        if (!Object.keys(v).includes('effect')) {
          rules.push({
            ...v,
            effect: ''
          });
        } else {
          rules.push(v);
        }
      });
    }

    return { rules };
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
          value: ''
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
      // let's delete the vKey prop as it's only poluting the data
      const rules = this.rules.map((rule) => {
        const newRule = { ...rule };

        // prevent vKey from being sent as data
        if (newRule.vKey) {
          delete newRule.vKey;
        }

        // let's clear the value field if operator is Exists
        if (newRule.operator === 'Exists' && newRule.value) {
          newRule.value = null;
        }

        // remove effect from payload sent upstream, as it's empty
        // it should be null, but the Select input doesn't seem to like it
        // so we keep it as '' and sanitize it here
        if (newRule.effect === '') {
          delete newRule.effect;
        }

        return newRule;
      });

      this.$emit('update:value', rules);
    },

    addToleration() {
      this.rules.push({ vKey: random32(), effect: '' });
    },

    updateEffect(neu, rule) {
      if (neu !== 'NoExecute' && rule.tolerationSeconds) {
        delete rule.tolerationSeconds;
      }

      this.update();
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
      v-for="(rule, index) in rules"
      :key="index"
      class="rule"
    >
      <div class="col">
        <LabeledInput
          v-model:value="rule.key"
          :mode="mode"
          :data-testid="`toleration-key-index${ index }`"
          class="height-adjust-input"
          @update:value="update"
        />
      </div>
      <div class="col">
        <Select
          id="operator"
          v-model:value="rule.operator"
          :options="operatorOpts"
          :mode="mode"
          :data-testid="`toleration-operator-index${ index }`"
          @update:value="update"
        />
      </div>
      <template v-if="rule.operator==='Exists'">
        <div class="col">
          <LabeledInput
            value="n/a"
            :mode="mode"
            disabled
            class="height-adjust-input"
          />
        </div>
      </template>
      <template v-else>
        <div class="col">
          <LabeledInput
            v-model:value="rule.value"
            :mode="mode"
            :data-testid="`toleration-value-index${ index }`"
            class="height-adjust-input"
            @update:value="update"
          />
        </div>
      </template>
      <div class="col">
        <Select
          v-model:value="rule.effect"
          :options="effectOpts"
          :mode="mode"
          :data-testid="`toleration-effect-index${ index }`"
          @update:value="e=>updateEffect(e, rule)"
        />
      </div>
      <div class="col">
        <UnitInput
          v-model:value="rule.tolerationSeconds"
          :disabled="rule.effect !== 'NoExecute'"
          :mode="mode"
          suffix="Seconds"
          :data-testid="`toleration-seconds-index${ index }`"
          class="height-adjust-input"
          @update:value="update"
        />
      </div>
      <div class="col remove">
        <button
          v-if="!isView"
          type="button"
          class="btn role-link"
          :disabled="mode==='view'"
          :data-testid="`toleration-remove-index${ index }`"
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
      data-testid="add-toleration-btn"
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
  grid-template-columns: 20% 10% 20% 15% 20% 15%;
  grid-gap: 10px;
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
.remove BUTTON {
  padding: 0px;
}
.height-adjust-input {
  min-height: 42px;
}
</style>
