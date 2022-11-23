<script>
import Vue from 'vue';

import { _VIEW } from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  name: 'DefaultLinksEditor',

  components: { Checkbox },

  props: {
    // Array of objects with key, label, value and enabled properties
    value: {
      type:    Array,
      default: () => [],
    },

    mode: {
      type:     String,
      required: true
    },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    showhide(row, i, e) {
      const value = this.value[i];

      Vue.set(value, 'enabled', !!value.enabled);
      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <div class="key-value">
    <div class="clearfix">
      <h3>
        {{ t('customLinks.settings.default') }}
      </h3>
    </div>

    <div class="kv-container">
      <label class="text-label">
        {{ t('customLinks.settings.keyLabel') }}
      </label>
      <label class="text-label">
        {{ t('customLinks.settings.valueLabel') }}
      </label>
      <label class="text-label" />

      <template v-for="(row,i) in value">
        <div
          :key="i+'key'"
          class="kv-item key"
          :class="{'link-hidden': !row.enabled}"
        >
          <span>{{ row.label }}</span>
        </div>

        <div
          :key="i+'value'"
          class="kv-item value"
          :class="{'link-hidden': !row.enabled}"
        >
          <span>{{ row.value }}</span>
        </div>

        <div
          v-if="!row.readonly && !isView"
          :key="i+'show'"
        >
          <Checkbox
            v-if="!isView"
            v-model="row.enabled"
            label-key="customLinks.settings.showLabel"
            @input="showhide(row, i, $event)"
          />
        </div>
        <div
          v-else
          :key="i+'show'"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.key-value {
  width: 100%;

  .kv-container {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr 50px;
    column-gap: $column-gutter;

    .kv-item {
      background-color: var(--disabled-bg);
      border: 1px solid var(--border);
      border-radius: 5px;
      width: 100%;
      margin: 10px 0px 10px 0px;
      height: 40px;
      line-height: 40px;
      padding: 0 10px;

      &.link-hidden {
        color: var(--disabled-text);
      }

      &.key {
        align-self: flex-start;
      }
    }
  }
}
</style>
