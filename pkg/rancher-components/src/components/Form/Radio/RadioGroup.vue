<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { _VIEW } from '@shell/config/query-params';
import RadioButton from '@components/Form/Radio/RadioButton.vue';

interface Option {
  value: unknown,
  label: string,
  description?: string,
}

export default defineComponent({
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

  emits: ['update:value'],

  data() {
    return { currFocusedElem: undefined as undefined | EventTarget | null };
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
    },
    radioGroupLabel(): string {
      return this.labelKey ? this.t(this.labelKey) : this.label ? this.label : '';
    }
  },

  beforeUnmount() {
    const radioGroup = this.$refs?.radioGroup as HTMLInputElement;

    radioGroup.removeEventListener('focusin', this.focusChanged);
  },

  mounted() {
    const radioGroup = this.$refs?.radioGroup as HTMLInputElement;

    radioGroup.addEventListener('focusin', this.focusChanged);
  },

  methods: {
    focusChanged(ev: Event) {
      this.currFocusedElem = ev.target;
    },
    /**
     * Keyboard left/right event listener to select next/previous option. Emits
     * the input event.
     */
    clickNext(direction: number): void {
      // moving focus away from a custom group element and pressing arrow keys
      // should not have any effect on the group - custom UI for radiogroup option(s)
      if (this.currFocusedElem !== this.$refs?.radioGroup) {
        return;
      }

      const opts = this.normalizedOptions;
      const selected = opts.find((x) => x.value === this.value);
      let newIndex = (selected ? opts.indexOf(selected) : -1) + direction;

      if (newIndex >= opts.length) {
        newIndex = opts.length - 1;
      } else if (newIndex < 0) {
        newIndex = 0;
      }

      this.$emit('update:value', opts[newIndex].value);
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
      ref="radioGroup"
      role="radiogroup"
      :aria-label="radioGroupLabel"
      class="radio-group"
      :class="{'row':row}"
      tabindex="0"
      @keydown.down.prevent.stop="clickNext(1)"
      @keydown.up.prevent.stop="clickNext(-1)"
      @keydown.space.enter.stop.prevent
    >
      <div
        v-for="(option, i) in normalizedOptions"
        :key="i"
      >
        <slot
          :v-bind="$attrs"
          :option="option"
          :is-disabled="isDisabled"
          :name="i"
        >
          <!-- Default input -->
          <RadioButton
            :name="name"
            :value="value"
            :label="option.label"
            :description="option.description"
            :val="option.value"
            :disabled="isDisabled"
            :data-testid="`radio-button-${i}`"
            :mode="mode"
            :prevent-focus-on-radio-groups="true"
            @update:value="$emit('update:value', $event)"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
.radio-group {
  &:focus, &:focus-visible {
    border: none;
    outline: none;
  }

  &:focus-visible .radio-button-checked {
    @include focus-outline;
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
