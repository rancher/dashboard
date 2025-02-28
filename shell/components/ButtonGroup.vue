<script>
export default {
  emits: ['update:value'],

  props: {
    value: {
      type:     [String, Number, Boolean, Object],
      required: true,
    },

    inactiveClass: {
      type:    String,
      default: 'bg-disabled',
    },

    activeClass: {
      type:    String,
      default: 'bg-primary',
    },

    options: {
      type:     Array,
      required: true,
    },

    iconSize: {
      type:    String,
      default: null,
    },

    disabled: {
      type:    Boolean,
      default: false,
    }

  },

  computed: {
    optionObjects() {
      const value = this.value;

      return this.options.map((opt) => {
        let out;

        if ( opt && typeof opt === 'object' && typeof opt.value !== 'undefined' ) {
          out = Object.assign({}, opt);
        } else {
          out = { label: opt, value: opt };
        }

        const active = value === out.value;

        out.class = {
          btn:                  true,
          [this.inactiveClass]: !active,
          [this.activeClass]:   active,
        };

        return out;
      });
    },
  },

  methods: {
    change(value) {
      this.$emit('update:value', value);
    },
    actionDescription(opt) {
      const tooltip = opt.tooltipKey ? this.t(opt.tooltipKey) : opt.tooltip;
      const label = opt.labelKey ? this.t(opt.labelKey) : opt.label;

      return tooltip || label || '';
    },
    actionAriaLabel(opt) {
      const ariaLabel = opt.ariaLabel;
      const label = opt.labelKey ? this.t(opt.labelKey) : opt.label;
      const tooltip = opt.tooltipKey ? this.t(opt.tooltipKey) : opt.tooltip;

      return ariaLabel || tooltip || label || undefined;
    }
  }
};
</script>

<template>
  <div
    v-trim-whitespace
    class="btn-group"
  >
    <button
      v-for="(opt,idx) in optionObjects"
      :key="idx"
      v-clean-tooltip="opt.tooltipKey ? t(opt.tooltipKey) : opt.tooltip"
      :data-testid="`button-group-child-${idx}`"
      type="button"
      :class="opt.class"
      :disabled="disabled || opt.disabled"
      role="button"
      :aria-label="actionAriaLabel(opt)"
      @click="change(opt.value)"
    >
      <slot
        name="option"
        :label="opt.label"
        :value="opt.value"
      >
        <i
          v-if="opt.icon"
          :class="{icon: true, [opt.icon]: true, [`icon-${iconSize}`]: !!iconSize }"
          :alt="actionAriaLabel(opt)"
        />
        <t
          v-if="opt.labelKey"
          :k="opt.labelKey"
        />
        <span v-else-if="opt.label">{{ opt.label }}</span>
      </slot>
    </button>
  </div>
</template>
