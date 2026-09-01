<script lang="ts">
import { defineComponent } from 'vue';
import Select from '@shell/components/form/Select.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import { _CREATE, _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';

import { parseTaint, EFFECT_OPTIONS, formatTaint } from '../util/taints';

export default defineComponent({
  emits: ['update:value', 'remove'],

  components: { Select, LabeledInput },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    taint: {
      type:     String,
      required: true
    },
    rules: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const { key, effect, value } = parseTaint(this.taint);

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
      const out = formatTaint(this.key, this.value, this.effect);

      this.$emit('update:value', out);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isEdit() {
      return this.mode !== _VIEW;
    },

    effectOptions() {
      return EFFECT_OPTIONS;
    },

    validationMessage() {
      const taint = formatTaint(this.key, this.value, this.effect);
      const rule = this.rules[0];

      if (rule && typeof rule === 'function') {
        return rule(taint);
      } else {
        return undefined;
      }
    }
  },
});
</script>

<template>
  <tr class="taint">
    <td :style="{'width': '40%'}">
      <LabeledInput
        v-model:value="key"
        :mode="mode"
        :rules="[()=>validationMessage]"
        type="text"
        data-testid="aks-taint-key-input"
      />
    </td>
    <td :style="{'width': '40%'}">
      <LabeledInput
        v-model:value="value"
        :mode="mode"
        type="text"
        :rules="[()=>validationMessage]"
        data-testid="aks-taint-value-input"
      />
    </td>
    <td :style="{'width': '15%'}">
      <Select
        v-model:value="effect"
        :mode="mode"
        :options="effectOptions"
        label="effect"
        data-testid="aks-taint-effect-select"
      />
    </td>
    <td>
      <button
        v-if="isEdit"
        type="button"
        class="btn role-link btn-sm"
        @click="$emit('remove')"
      >
        {{ t('generic.remove') }}
      </button>
    </td>
  </tr>
</template>
