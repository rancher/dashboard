<script lang="ts">
import { defineComponent } from 'vue';
import Select from '@shell/components/form/Select.vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';

import { parseTaint, EFFECT_OPTIONS, formatTaint } from '../util/aks';

export default defineComponent({
  components: { Select },

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

      this.$emit('input', out);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

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
  <tr class="taint">
    <td :style="{'width': '40%'}">
      <input
        v-model="key"
        label="key"
        :mode="mode"
      >
    </td>
    <td :style="{'width': '40%'}">
      <input
        v-model="value"
        label="value"
        :mode="mode"
        type="text"
      >
    </td>
    <td :style="{'width': '15%'}">
      <Select
        v-model="effect"
        :mode="mode"
        :options="effectOptions"
        label="effect"
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
