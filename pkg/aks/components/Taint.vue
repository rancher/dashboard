<script lang="ts">
import { randomStr } from '@shell/utils/string';
import Vue, { defineComponent } from 'vue';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Select from '@shell/components/form/Select.vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';

const EFFECT_OPTIONS = ['PreferNoSchedule', 'NoExecute', 'NoSchedule'];

export default defineComponent({
  components: {
    // LabeledInput,
    // LabeledSelect,
    Select
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    taint: {
      type:     String,
      required: true
    }
  },

  data() {
    // taints are stored as an array of strings in the format key=value:effect
    const { key = '', value = '', effect = EFFECT_OPTIONS[0] } = (this.taint.match(/^(?<key>([A-Z]|[a-z]|[0-9])*)=(?<value>([A-Z]|[a-z]|[0-9])*):(?<effect>([A-Z]|[a-z]|[0-9])*)$/g)?.groups || {});

    return {
      key, effect, value
    };
  },

  watch: {
    key() {
      this.update();
    },
    value() {
      this.update();
    },
    effect() {
      this.update();
    }
  },

  methods: {
    update() {
      const out = `${ this.key }=${ this.value }:${ this.effect }`;

      this.$emit('input', out);
    }
  },

  computed: {
    isEdit() {
      return this.mode !== _VIEW;
    },

    effectOptions() {
      return EFFECT_OPTIONS;
    }
  },
});
</script>

<template>
  <div class="taint">
    <!-- <LabeledInput
      v-model="key"
      label="key"
      :mode="mode"
    />

    <LabeledInput
      v-model="value"
      label="value"
      :mode="mode"
    />

    <LabeledSelect
      v-model="effect"
      :mode="mode"
      :options="effectOptions"
      label="effect"
    /> -->
    <input
      v-model="key"
      label="key"
      :mode="mode"
    >

    <input
      v-model="value"
      label="value"
      :mode="mode"
    >

    <Select
      v-model="effect"
      :mode="mode"
      :options="effectOptions"
      label="effect"
    />
    <div>
      <button
        v-if="isEdit"
        type="button"
        class="btn role-link btn-sm"
        @click="$emit('remove')"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.taint {
  display: flex;
  align-items: center;

  &>:not(:last-child) {
    margin-right: 10px;
  }
}
</style>
