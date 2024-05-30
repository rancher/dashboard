<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';
import Select from '@shell/components/form/Select';

const EFFECT_VALUES = {
  NO_SCHEDULE:        'NoSchedule',
  PREFER_NO_SCHEDULE: 'PreferNoSchedule',
  NO_EXECUTE:         'NoExecute',
};

export default {
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
    }
  },

  data() {
    return { effectOptions: Object.values(EFFECT_VALUES).map((v) => ({ label: v, value: v })) };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },

      set(localValue) {
        this.$emit('input', localValue);
      }
    },

    defaultAddData() {
      return { effect: EFFECT_VALUES.NO_SCHEDULE };
    }
  }
};
</script>

<template>
  <div class="taints">
    <KeyValue
      v-model="localValue"
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
    >
      <template #label:effect>
        {{ t('tableHeaders.effect') }}
      </template>

      <template #col:effect="{row, queueUpdate}">
        <Select
          v-model="row.effect"
          :options="effectOptions"
          :disabled="disabled"
          class="compact-select"
          @update:modelValue="queueUpdate"
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
