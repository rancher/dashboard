<script>
import $ from 'jquery';
import { _EDIT } from '@/config/query-params';

export default {
  props: {
    value: {
      type:    Boolean,
      default: false
    },

    label: {
      type:    String,
      default: null
    },

    labelKey: {
      type:    String,
      default: null
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    indeterminate: {
      type:    Boolean,
      default: false
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    tooltip: {
      type:    [String, Object],
      default: null
    },

    tooltipKey: {
      type:    String,
      default: null
    },
  },

  computed: {
    isDisabled() {
      return (this.disabled || this.mode === 'view' );
    }
  },

  methods: {
    clicked(event) {
      if (!this.isDisabled) {
        const click = $.Event('click');

        click.shiftKey = event.shiftKey;
        click.altKey = event.altKey;
        click.ctrlKey = event.ctrlKey;
        click.metaKey = event.metaKey;

        this.$emit('input', !this.value);
        $(this.$el).trigger(click);
      }
    }
  }
};
</script>

<template>
  <label
    class="checkbox-container"
    :class="{disabled}"
    @keydown.enter.prevent="clicked($event)"
    @keydown.space.prevent="clicked($event)"
    @click.stop.prevent="clicked($event)"
  >
    <input
      :checked="value"
      :v-model="value"
      type="checkbox"
      :tabindex="-1"
      @click.stop.prevent
    />
    <span
      class="checkbox-custom"
      :class="{indeterminate: indeterminate}"
      :tabindex="isDisabled ? -1 : 0"
      :aria-label="label"
      :aria-checked="!!value"
      role="checkbox"
    />
    <span
      class="checkbox-label"
    >
      <slot name="label">
        <t v-if="labelKey" :k="labelKey" />
        <template v-else-if="label">{{ label }}</template>
        <i v-if="tooltipKey" v-tooltip="t(tooltipKey)" class="checkbox-info icon icon-info icon-lg" />
        <i v-else-if="tooltip" v-tooltip="tooltip" class="checkbox-info icon icon-info icon-lg" />
      </slot>
    </span>
  </label>
</template>

<style lang='scss'>
// NOTE: SortableTable depends on the names of this class, do not arbitrarily change.
.checkbox-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: var(--border-radius);

  .checkbox-label {
    color: var(--input-label);
    display: inline-flex;
    margin: 0px 10px 0px 5px;
  }

  .checkbox-info {
    line-height: normal;
    margin-left: 2px;
  }

 .checkbox-custom {
    height: 14px;
    width: 14px;
    background-color: var(--body-bg);
    border-radius: var(--border-radius);
    transition: all 0.3s ease-out;
    border: 1px solid var(--border);
  }

  input {
    display: none;
  }

  input:checked ~ .checkbox-custom {
    background-color:var(--dropdown-text);
    -webkit-transform: rotate(0deg) scale(1);
    -ms-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1);
    opacity:1;
    border: 1px solid var(--dropdown-text);
  }

  // Custom Checkbox tick
  .checkbox-custom::after {
    position: absolute;
    content: "";
    left: 0px;
    top: 0px;
    height: 0px;
    width: 0px;
    border-radius: var(--border-radius);
    border: solid;
    border-color: var(--input-text);
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(0deg) scale(0);
    -ms-transform: rotate(0deg) scale(0);
    transform: rotate(0deg) scale(0);
    opacity:1;
  }

  input:checked ~ .checkbox-custom::after {
    -webkit-transform: rotate(45deg) scale(1);
    -ms-transform: rotate(45deg) scale(1);
    transform: rotate(45deg) scale(1);
    opacity:1;
    left: 4px;
    width: 4px;
    height: 10px;
    border: solid;
    border-color: var(--checkbox-tick);
    border-width: 0 2px 2px 0;
    background-color: transparent;
  }

  input:checked ~ .checkbox-custom.indeterminate::after {
    -webkit-transform:  scale(1);
    -ms-transform:  scale(1);
    transform:  scale(1);
    opacity:1;
    left: 3px;
    top:2px;
    width: 6px;
    height: 5px;
    border: solid;
    border-color: var(--checkbox-tick);
    border-width: 0 0 2px 0;
    background-color: transparent;
  }

  // Disabled styles
  &.disabled {
    .checkbox-custom {
      background-color: var(--checkbox-disabled-bg);
      border-color: var(--checkbox-disabled-bg);
    }
    input:checked ~ .checkbox-custom {
      background-color: var(--checkbox-disabled-bg);
      border-color: var(--checkbox-disabled-bg);
      &::after {
        border-color: var(--checkbox-tick-disabled);
      }
    }
  }

  &.disabled {
    cursor: not-allowed;
  }

  .checkbox-view {
    display: flex;
    flex-direction: column;
    LABEL {
      color: var(--input-label)
    }
  }
}
</style>
