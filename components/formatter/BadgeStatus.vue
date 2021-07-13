<script>
import { get } from '@/utils/object';
import { findBy } from '@/utils/array';

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    }
  },

  data() {
    return { phase: this.row[this.state] };
  },

  computed: {
    state() {
      return this.col?.state;
    },
    tipMessage() {
      const conditions = get(this.row, 'status.conditions');
      const message = findBy(conditions, 'type', 'Running')?.message;

      return this.phase !== 'Succeeded' && message;
    }
  },

  watch: {
    row: {
      handler() {
        this.phase = this.row[this.state];
      },
      deep:      true,
      immediate: true
    }
  }
};
</script>

<template>
  <span v-tooltip="tipMessage" :class="{'badge-state': true, [row.phaseStatusBackgroud]: true}">
    {{ phase }}
  </span>
</template>

<style lang="scss" scoped>
  .badge-state {
    padding: 5px 10px;
    border: 1px solid transparent;
    border-radius: 20px;

    &.bg-info {
      border-color: var(--primary);
    }

    &.bg-error {
      border-color: var(--error);
    }

    &.bg-warning {
      border-color: var(--warning);
    }

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      color: var(--success);
      border-color: var(--success);
      background: transparent;
    }
  }

  .sortable-table TD .badge-state {
    @include clip;
    display: inline-block;
    max-width: 100%;
    position: relative;
    padding: 2px 10px 1px 10px;
    font-size: 1em;
    max-width: 150px;
    font-size: .85em;
    vertical-align: middle;
  }
</style>
