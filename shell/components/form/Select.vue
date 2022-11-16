<script>
import { get } from '@shell/utils/object';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import VueSelectOverrides from '@shell/mixins/vue-select-overrides';
import { LabeledTooltip } from '@components/LabeledTooltip';
import { onClickOption, calculatePosition } from '@shell/utils/select';

export default {
  components: { LabeledTooltip },
  mixins:     [LabeledFormElement, VueSelectOverrides],
  props:      {
    appendToBody: {
      default: true,
      type:    Boolean,
    },
    disabled: {
      default: false,
      type:    Boolean,
    },
    getKeyForOption: {
      default: null,
      type:    Function
    },
    mode: {
      default: 'edit',
      type:    String,
    },
    optionKey: {
      default: null,
      type:    String,
    },
    optionLabel: {
      default: 'label',
      type:    String,
    },
    placement: {
      default: null,
      type:    String,
    },
    placeholder: {
      type:    String,
      default: '',
    },
    popperOverride: {
      type:    Function,
      default: null,
    },
    reduce: {
      default: (e) => {
        if (e && typeof e === 'object' && e.value !== undefined) {
          return e.value;
        }

        return e;
      },
      type: Function,
    },
    tooltip: {
      type:    String,
      default: null,
    },

    hoverTooltip: {
      type:    Boolean,
      default: true,
    },

    status: {
      type:    String,
      default: null,
    },
    value: {
      default: null,
      type:    [String, Object, Number, Array, Boolean],
    },
    closeOnSelect: {
      type:    Boolean,
      default: true
    },
  },

  methods: {
    // resizeHandler = in mixin
    getOptionLabel(option) {
      if (this.$attrs['get-option-label']) {
        return this.$attrs['get-option-label'](option);
      }
      if (get(option, this.optionLabel)) {
        if (this.localizedLabel) {
          return this.$store.getters['i18n/t'](get(option, this.optionLabel));
        } else {
          return get(option, this.optionLabel);
        }
      } else {
        return option;
      }
    },

    positionDropdown(dropdownList, component, { width }) {
      if (this.popperOverride) {
        return this.popperOverride(dropdownList, component, { width });
      }

      calculatePosition(dropdownList, component, width, this.placement);
    },

    focus() {
      this.focusSearch();
    },

    focusSearch() {
      this.$nextTick(() => {
        const el = this.$refs['select-input']?.searchEl;

        if ( el ) {
          el.focus();
        }
      });
    },

    get,

    onClickOption(option, event) {
      onClickOption.call(this, option, event);
    },
    selectable(opt) {
      // Lets you disable options that are used
      // for headings on groups of options.
      if ( opt ) {
        if ( opt.disabled || opt.kind === 'group' || opt.kind === 'divider' || opt.loading ) {
          return false;
        }
      }

      return true;
    },
    getOptionKey(opt) {
      if (opt.optionKey) {
        return get(opt, opt.optionKey);
      }

      const label = this.getOptionLabel(opt);

      // label may be type of object
      if (typeof label === 'string' || typeof label === 'number') {
        return label;
      } else {
        return Math.random(100000);
      }
    },
    report(e) {
      alert(e);
    }
  },
  computed: {
    requiredField() {
      // using "any" for a type on "rule" here is dirty but the use of the optional chaining operator makes it safe for what we're doing here.
      return (this.required || this.rules.some(rule => rule?.name === 'required'));
    },
    validationMessage() {
      // we want to grab the required rule passed in if we can but if it's not there then we can just grab it from the formRulesGenerator
      const requiredRule = this.rules.find(rule => rule?.name === 'required');
      const ruleMessages = [];
      const value = this?.value;

      if (requiredRule && this.blurred && !this.focused) {
        const message = requiredRule(value);

        if (!!message) {
          return message;
        }
      }

      for (const rule of this.rules) {
        const message = rule(value);

        if (!!message && rule.name !== 'required') { // we're catching 'required' above so we can ignore it here
          ruleMessages.push(message);
        }
      }
      if (ruleMessages.length > 0 && (this.blurred || this.focused)) {
        return ruleMessages.join(', ');
      } else {
        return undefined;
      }
    }
  }
};
</script>

<template>
  <div
    ref="select"
    class="unlabeled-select"
    :class="{
      disabled: disabled && !isView,
      focused,
      [mode]: true,
      [status]: status,
      taggable: $attrs.taggable,
      taggable: $attrs.multiple,
    }"
    @focus="focusSearch"
  >
    <v-select
      ref="select-input"
      v-bind="$attrs"
      class="inline"
      :class="{'select-input-view': mode === 'view'}"
      :autoscroll="true"
      :append-to-body="appendToBody"
      :calculate-position="positionDropdown"
      :disabled="isView || disabled"
      :get-option-key="(opt) => getOptionKey(opt)"
      :get-option-label="(opt) => getOptionLabel(opt)"
      :label="optionLabel"
      :options="options"
      :close-on-select="closeOnSelect"
      :map-keydown="mappedKeys"
      :placeholder="placeholder"
      :reduce="(x) => reduce(x)"
      :searchable="isSearchable"
      :selectable="selectable"
      :value="value != null ? value : ''"
      v-on="$listeners"
      @search:blur="onBlur"
      @search:focus="onFocus"
      @open="resizeHandler"
      @option:created="(e) => $emit('createdListItem', e)"
    >
      <template #option="option">
        <div @mousedown="(e) => onClickOption(option, e)">
          {{ option.label }}
        </div>
      </template>
      <!-- Pass down templates provided by the caller -->
      <template
        v-for="(_, slot) of $scopedSlots"
        v-slot:[slot]="scope"
      >
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>
    </v-select>
    <LabeledTooltip
      v-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
    />
    <LabeledTooltip
      v-if="!!validationMessage"
      :hover="hoverTooltip"
      :value="validationMessage"
    />
  </div>
</template>

<style lang="scss" scoped>
  .unlabeled-select {
    position: relative;

    ::v-deep .v-select.select-input-view {
      .vs__actions {
        visibility: hidden;
      }
    }

    ::v-deep .labeled-tooltip.error .status-icon {
      top: 7px;
      right: 2px;
    }

    ::v-deep .vs__selected-options {
      display: flex;

      .vs__selected {
          width: 100%;
      }
    }

    ::v-deep .v-select.vs--open {
      .vs__dropdown-toggle {
        color: var(--outline) !important;
      }
    }

    ::v-deep .v-select.vs--open {
      .vs__dropdown-toggle {
        color: var(--outline) !important;
      }
    }

    @include input-status-color;
  }
</style>
