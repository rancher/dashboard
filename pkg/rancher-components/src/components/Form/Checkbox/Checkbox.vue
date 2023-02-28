<script lang="ts">
import Vue, { PropType } from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { addObject, removeObject } from '@shell/utils/array';
import cloneDeep from 'lodash/cloneDeep';

export default Vue.extend({
  name: 'Checkbox',

  props: {
    /**
     * The checkbox value.
     */
    value: {
      type:    [Boolean, Array, String] as PropType<boolean | boolean[] | string>,
      default: false
    },

    /**
     * The checkbox label.
     */
    label: {
      type:    String,
      default: null
    },

    /**
     * The i18n key to use for the checkbox label.
     */
    labelKey: {
      type:    String,
      default: null
    },

    /**
     * Random ID generated for binding label to input.
     */
    id: {
      type:    String,
      default: String(Math.random() * 1000)
    },

    /**
     * Disable the checkbox.
     */
    disabled: {
      type:    Boolean,
      default: false
    },

    /**
     * Display an indeterminate state. Useful for cases where a checkbox might
     * be the parent to child checkboxes, and we need to show that a subset of
     * children are checked.
     */
    indeterminate: {
      type:    Boolean,
      default: false
    },

    /**
     * The checkbox editing mode.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: _EDIT
    },

    /**
     * The contents of the checkbox tooltip.
     */
    tooltip: {
      type:    [String, Object],
      default: null
    },

    /**
     * The i18n key to use for the checkbox tooltip.
     */
    tooltipKey: {
      type:    String,
      default: null
    },

    /**
     * A custom value to use when the checkbox is checked.
     */
    valueWhenTrue: {
      type:    [Boolean, String, Number],
      default: true
    },

    /**
     * The i18n key to use for the checkbox description.
     */
    descriptionKey: {
      type:    String,
      default: null
    },

    /**
     * The checkbox description.
     */
    description: {
      type:    String,
      default: null
    },

    /**
     * Primary checkbox displays label so that it stands out more
     */
    primary: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    /**
     * Determines if the checkbox is disabled.
     * @returns boolean: True when the disabled prop is true or when mode is
     * View.
     */
    isDisabled(): boolean {
      return (this.disabled || this.mode === _VIEW);
    },
    /**
     * Determines if the checkbox is checked when using custom values or
     * multiple values.
     * @returns boolean: True when at least one value is true in a collection or
     * when value matches `this.valueWhenTrue`.
     */
    isChecked(): boolean {
      return this.isMulti(this.value) ? this.findTrueValues(this.value) : this.value === this.valueWhenTrue;
    }
  },

  methods: {
    /**
     * Toggles the checked state for the checkbox and emits an 'input' event.
     */
    clicked(event: MouseEvent): boolean | void {
      if ((event.target as HTMLLinkElement).tagName === 'A' && (event.target as HTMLLinkElement).href) {
        // Ignore links inside the checkbox label so you can click them
        return true;
      }

      event.stopPropagation();
      event.preventDefault();

      if (this.isDisabled) {
        return;
      }

      const customEvent = {
        bubbles:    true,
        cancelable: false,
        shiftKey:   event.shiftKey,
        altKey:     event.altKey,
        ctrlKey:    event.ctrlKey,
        metaKey:    event.metaKey
      };

      const click = new CustomEvent('click', customEvent);

      // Flip the value
      const value = cloneDeep(this.value);

      if (this.isMulti(value)) {
        if (this.isChecked) {
          removeObject(value, this.valueWhenTrue);
        } else {
          addObject(value, this.valueWhenTrue);
        }
        this.$emit('input', value);
      } else if (this.isString(this.valueWhenTrue)) {
        if (this.isChecked) {
          this.$emit('input', null);
        } else {
          this.$emit('input', this.valueWhenTrue);
        }
      } else {
        this.$emit('input', !value);
        this.$el.dispatchEvent(click);
      }
    },

    /**
     * Determines if there are multiple values for the checkbox.
     */
    isMulti(value: boolean | boolean[] | string): value is boolean[] {
      return Array.isArray(value);
    },

    isString(value: boolean | number | string): value is boolean {
      return typeof value === 'string';
    },

    /**
     * Finds the first true value for multiple checkboxes.
     * @param value A collection of values for the checkbox.
     */
    findTrueValues(value: boolean[]): boolean {
      return value.find(v => v === this.valueWhenTrue) || false;
    }
  }
});
</script>

<template>
  <div
    class="checkbox-outer-container"
    data-checkbox-ctrl
  >
    <label
      class="checkbox-container"
      :class="{ 'disabled': isDisabled}"
      :for="id"
      @keydown.enter.prevent="clicked($event)"
      @keydown.space.prevent="clicked($event)"
      @click="clicked($event)"
    >
      <input
        :checked="isChecked"
        :value="valueWhenTrue"
        type="checkbox"
        :tabindex="-1"
        :name="id"
        @click.stop.prevent
      >
      <span
        class="checkbox-custom"
        :class="{indeterminate: indeterminate}"
        :tabindex="isDisabled ? -1 : 0"
        :aria-label="label"
        :aria-checked="!!value"
        role="checkbox"
      />
      <span
        v-if="$slots.label || label || labelKey || tooltipKey || tooltip"
        class="checkbox-label"
        :class="{ 'checkbox-primary': primary }"
      >
        <slot name="label">
          <t
            v-if="labelKey"
            :k="labelKey"
            :raw="true"
          />
          <template v-else-if="label">{{ label }}</template>
          <i
            v-if="tooltipKey"
            v-tooltip="t(tooltipKey)"
            class="checkbox-info icon icon-info icon-lg"
          />
          <i
            v-else-if="tooltip"
            v-tooltip="tooltip"
            class="checkbox-info icon icon-info icon-lg"
          />
        </slot>
      </span>
    </label>
    <div
      v-if="descriptionKey || description"
      class="checkbox-outer-container-description"
    >
      <t
        v-if="descriptionKey"
        :k="descriptionKey"
      />
      <template v-else-if="description">
        {{ description }}
      </template>
    </div>
  </div>
</template>

<style lang='scss'>
$fontColor: var(--input-label);

.checkbox-outer-container {
  display: inline-flex;
  flex-direction: column;
  &-description {
    color: $fontColor;
    font-size: 14px;
    margin-left: 19px;
    margin-top: 5px;
    opacity: 0.8;
  }
}

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

    &.checkbox-primary {
      color: inherit;
      font-weight: 600;
    }
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
    // display: none;
    opacity: 0;
    position: absolute;
    z-index: -1;
  }

  input:checked ~ .checkbox-custom {
    background-color:var(--primary);
    -webkit-transform: rotate(0deg) scale(1);
    -ms-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1);
    opacity:1;
    border: 1px solid var(--primary);
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
      color: $fontColor;
    }
  }
}
</style>
