<script lang="ts">
import Vue, { PropType } from 'vue';
import { _VIEW } from '@shell/config/query-params';
import RadioButton from '@components/Form/Radio/RadioButton.vue';

interface Option {
  value: unknown,
  label: string
}

export default Vue.extend({
  components: { RadioButton },
  props:      {
    /**
     * Name for the checkbox grouping, must be unique on page.
     */
    name: {
      type:     String,
      required: true
    },

    /**
     * Options can be an array of {label, value}, or just values.
     */
    options: {
      type:     Array as PropType<Option[] | string[]>,
      required: true
    },

    /**
     * If options are just values, then labels can be a corresponding display
     * value.
     */
    labels: {
      type:    Array as PropType<string[]>,
      default: null
    },

    /**
     * The selected value.
     */
    value: {
      type:    [Boolean, String, Object],
      default: null
    },

    /**
     * Disable the radio group.
     */
    disabled: {
      type:    Boolean,
      default: false
    },

    /**
     * The radio group editing mode.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: 'edit'
    },

    /**
     * Label for above the radios.
     */
    label: {
      type:    String,
      default: null
    },

    /**
     * The i18n key to use for the radio group label.
     */
    labelKey: {
      type:    String,
      default: null
    },

    /**
     * Radio group tooltip.
     */
    tooltip: {
      type:    [String, Object],
      default: null
    },

    /**
     * The i18n key to use for the radio group tooltip.
     */
    tooltipKey: {
      type:    String,
      default: null
    },

    /**
     * Show radio buttons in column or row.
     */
    row: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    /**
     * Creates a collection of Options from the provided props.
     */
    normalizedOptions(): Option[] {
      const out: Option[] = [];

      for (let i = 0; i < this.options.length; i++) {
        const opt = this.options[i];

        if (typeof opt === 'object' && opt) {
          out.push(opt);
        } else if (this.labels) {
          out.push({
            label: this.labels[i],
            value: opt
          });
        } else {
          out.push({
            label: opt,
            value: opt
          });
        }
      }

      return out;
    },

    /**
     * Determines the view mode for the radio group.
     */
    isView(): boolean {
      return this.mode === _VIEW;
    },

    /**
     * Determines if the radio group is disabled.
     */
    isDisabled(): boolean {
      return (this.disabled || this.isView);
    }
  },

  methods: {
    /**
     * Keyboard left/right event listener to select next/previous option. Emits
     * the input event.
     */
    clickNext(direction: number): void {
      const opts = this.normalizedOptions;
      const selected = opts.find((x) => x.value === this.value);
      let newIndex = (selected ? opts.indexOf(selected) : -1) + direction;

      if (newIndex >= opts.length) {
        newIndex = opts.length - 1;
      } else if (newIndex < 0) {
        newIndex = 0;
      }

      this.$emit('input', opts[newIndex].value);
    }
  }
});
</script>

<template>
  <div>
    <!-- Label -->
    <div
      v-if="label || labelKey || tooltip || tooltipKey || $slots.label"
      class="radio-group label"
    >
      <slot name="label">
        <h3>
          <t
            v-if="labelKey"
            :k="labelKey"
          />
          <template v-else-if="label">
            {{ label }}
          </template>
          <i
            v-if="tooltipKey"
            v-clean-tooltip="t(tooltipKey)"
            class="icon icon-info icon-lg"
          />
          <i
            v-else-if="tooltip"
            v-clean-tooltip="tooltip"
            class="icon icon-info icon-lg"
          />
        </h3>
      </slot>
    </div>

    <!-- Group -->
    <div
      class="radio-group"
      :class="{'row':row}"
      tabindex="0"
      @keyup.down.stop="clickNext(1)"
      @keyup.up.stop="clickNext(-1)"
    >
      <div
        v-for="(option, i) in normalizedOptions"
        :key="name+'-'+i"
      >
        <slot
          :listeners="$listeners"
          :option="option"
          :is-disabled="isDisabled"
          :name="i"
        >
          <!-- Default input -->
          <RadioButton
            :key="name+'-'+i"
            :name="name"
            :value="value"
            :label="option.label"
            :description="option.description"
            :val="option.value"
            :disabled="isDisabled"
            :mode="mode"
            v-on="$listeners"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
.radio-group {
  &:focus {
    border:none;
    outline:none;
  }

  h3 {
    position: relative;
  }

  &.row {
    display: flex;
    .radio-container {
      margin-right: 10px;
    }
  }

  .label{
    font-size: 14px !important;
  }
}
</style>
