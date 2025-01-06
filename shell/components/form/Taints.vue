<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';
import Select from '@shell/components/form/Select';

const DEFAULT_EFFECT_VALUES = {
  NoSchedule:       'NoSchedule',
  PreferNoSchedule: 'PreferNoSchedule',
  NoExecute:        'NoExecute',
};

export default {
  emits: ['update:value', 'input'],

  components: { KeyValue, Select },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    },
    disabled: {
      default: false,
      type:    Boolean
    },
    effectValues: {
      type:    Object,
      default: () => DEFAULT_EFFECT_VALUES
    }
  },

  data() {
    return { effectOptions: Object.keys(this.effectValues).map((k) => ({ label: this.effectValues[k], value: k })) };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },

      set(localValue) {
        this.$emit('update:value', localValue);
      }
    },

    defaultAddData() {
      return { effect: this.effectOptions[0].value };
    }
  }
};
</script>

<template>
  <div class="taints">
    <KeyValue
      :value="value"
      data-testid="taints-keyvalue"
      :title="t('tableHeaders.taints')"
      :mode="mode"
      :as-map="false"
      :read-allowed="false"
      :protip="false"
      :show-header="true"
      :default-add-data="defaultAddData"
      :extra-columns="['effect']"
      :preserve-keys="['effect']"
      :add-label="t('labels.addTaint')"
      :disabled="disabled"
      @update:value="(e) => $emit('update:value', e)"
    >
      <template #label:effect>
        {{ t('tableHeaders.effect') }}
      </template>

      <template #col:effect="{row, queueUpdate, i}">
        <Select
          v-model:value="row.effect"
          :data-testid="`taints-effect-row-${i}`"
          :options="effectOptions"
          :disabled="disabled"
          class="compact-select"
          @update:value="queueUpdate"
        />
      </template>
    </KeyValue>
  </div>
</template>

<style lang="scss" scoped>
  .compact-select {
    height: 40px;
  }
</style>
