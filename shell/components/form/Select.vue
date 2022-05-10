<script>
import { get } from '@shell/utils/object';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import VueSelectOverrides from '@shell/mixins/vue-select-overrides';
import LabeledTooltip from '@shell/components/form/LabeledTooltip';
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
    options: {
      default:   null,
      type:      Array,
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

    searchable: {
      default: false,
      type:    Boolean,
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

      return this.getOptionLabel(opt);
    },
    report(e) {
      alert(e);
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
      @input="(e) => $emit('input', e)"
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
      <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </v-select>
    <LabeledTooltip
      v-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
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
