<script lang="ts">
// @ts-nocheck
import { defineComponent } from 'vue';
import Select from '@shell/components/form/Select.vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';

const EFFECT_OPTIONS = ['PreferNoSchedule', 'NoExecute', 'NoSchedule'];

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
