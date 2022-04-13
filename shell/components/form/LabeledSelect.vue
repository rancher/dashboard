<script>
import CompactInput from '@shell/mixins/compact-input';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import LabeledTooltip from '@shell/components/form/LabeledTooltip';
import VueSelectOverrides from '@shell/mixins/vue-select-overrides';
import { onClickOption, calculatePosition } from '@shell/utils/select';

export default {
  name: 'LabeledSelect',

  components: { LabeledTooltip },
  mixins:     [CompactInput, LabeledFormElement, VueSelectOverrides],

  props: {
    appendToBody: {
      default: true,
      type:    Boolean,
    },
    clearable: {
      default: false,
      type:    Boolean
    },
    disabled: {
      default: false,
      type:    Boolean
    },
    hoverTooltip: {
      default: true,
      type:    Boolean
    },
    loading: {
      default: false,
      type:    Boolean
    },
    localizedLabel: {
      default: false,
      type:    Boolean
    },
    optionKey: {
      default: null,
      type:    String
    },
    optionLabel: {
      default: 'label',
      type:    String
    },
    options: {
      default:   null,
      type:      Array
    },
    placement: {
      default: null,
      type:    String
    },
    reduce: {
      default: (e) => {
        if (e && typeof e === 'object' && e.value !== undefined) {
          return e.value;
        }

        return e;
      },
      type: Function
    },
    searchable: {
      default: false,
      type:    Boolean
    },
    selectable: {
      default: (opt) => {
        if ( opt ) {
          if ( opt.disabled || opt.kind === 'group' || opt.kind === 'divider' || opt.loading ) {
            return false;
          }
        }

        return true;
      },
      type: Function
    },
    status: {
      default: null,
      type:    String
    },
    tooltip: {
      default: null,
      type:    [String, Object]
    },
    value: {
      default: null,
      type:    [String, Object, Number, Array, Boolean]
    },
    closeOnSelect: {
      type:    Boolean,
      default: true
    },
  },

  data() {
    return {
      selectedVisibility: 'visible',
      shouldOpen:         true
    };
  },

  computed: {
    hasLabel() {
      return this.isCompact ? false : !!this.label || !!this.labelKey || !!this.$slots.label;
    },

    currentLabel() {
      const entry = findBy(this.options || [], 'value', this.value);

      if (entry) {
        return entry.label;
      }

      return this.getOptionLabel(this.value);
    },
  },

  methods: {
    // resizeHandler = in mixin
    focusSearch() {
      const blurredAgo = Date.now() - this.blurred;

      if (!this.focused && blurredAgo < 250) {
        return;
      }

      this.$nextTick(() => {
        const el = this.$refs['select-input']?.searchEl;

        if (el) {
          el.focus();
        }
      });
    },

    onFocus() {
      this.selectedVisibility = 'hidden';
      this.onFocusLabeled();
    },

    onBlur() {
      this.selectedVisibility = 'visible';
      this.onBlurLabeled();
    },

    onOpen() {
      this.$emit('on-open');
      this.resizeHandler();
    },

    getOptionLabel(option) {
      if (!option) {
        return;
      }
      if (this.$attrs['get-option-label']) {
        return this.$attrs['get-option-label'](option);
      }
      if (get(option, this.optionLabel)) {
        if (this.localizedLabel) {
          const label = get(option, this.optionLabel);

          return this.$store.getters['i18n/t'](label) || label;
        } else {
          return get(option, this.optionLabel);
        }
      } else {
        return option;
      }
    },

    positionDropdown(dropdownList, component, { width }) {
      calculatePosition(dropdownList, component, width, this.placement);
    },

    get,

    onClickOption(option, event) {
      onClickOption.call(this, option, event);
    },

    dropdownShouldOpen(instance, forceOpen = false) {
      const { noDrop, mutableLoading } = instance;
      const { open } = instance;
      const shouldOpen = this.shouldOpen;

      if (forceOpen) {
        instance.open = true;

        return true;
      }

      if (shouldOpen === false) {
        this.shouldOpen = true;
        instance.closeSearchOptions();
      }

      return noDrop ? false : open && shouldOpen && !mutableLoading;
    },

    onSearch(newSearchString) {
      if (newSearchString) {
        this.dropdownShouldOpen(this.$refs['select-input'], true);
      }
    },
  },
};
</script>

<template>
  <div
    ref="select"
    class="labeled-select"
    :class="{
      disabled: isView || disabled,
      focused,
      [mode]: true,
      [status]: status,
      taggable: $attrs.taggable,
      taggable: $attrs.multiple,
      hoverable: hoverTooltip,
      'compact-input': isCompact,
      'no-label': !hasLabel,
    }"
    @click="focusSearch"
    @focus="focusSearch"
  >
    <div
      :class="{ 'labeled-container': true, raised, empty, [mode]: true }"
      :style="{ border: 'none' }"
    >
      <label v-if="hasLabel">
        <t v-if="labelKey" :k="labelKey" />
        <template v-else-if="label">{{ label }}</template>

        <span v-if="required" class="required">*</span>
      </label>
    </div>
    <v-select
      ref="select-input"
      v-bind="$attrs"
      class="inline"
      :append-to-body="appendToBody"
      :calculate-position="positionDropdown"
      :class="{ 'no-label': !(label || '').length }"
      :disabled="isView || disabled || loading"
      :get-option-key="
        (opt) => (optionKey ? get(opt, optionKey) : getOptionLabel(opt))
      "
      :get-option-label="(opt) => getOptionLabel(opt)"
      :label="optionLabel"
      :options="options"
      :map-keydown="mappedKeys"
      :placeholder="placeholder"
      :reduce="(x) => reduce(x)"
      :searchable="isSearchable"
      :selectable="selectable"
      :value="value != null && !loading ? value : ''"
      :dropdown-should-open="dropdownShouldOpen"
      v-on="$listeners"
      @search:blur="onBlur"
      @search:focus="onFocus"
      @search="onSearch"
      @open="onOpen"
    >
      <template #option="option">
        <template v-if="option.kind === 'group'">
          <div class="vs__option-kind-group">
            <b>{{ getOptionLabel(option) }}</b>
            <div v-if="option.badge">
              {{ option.badge }}
            </div>
          </div>
        </template>
        <template v-else-if="option.kind === 'divider'">
          <hr />
        </template>
        <div v-else @mousedown="(e) => onClickOption(option, e)">
          {{ getOptionLabel(option) }}
        </div>
      </template>
      <!-- Pass down templates provided by the caller -->
      <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </v-select>
    <i v-if="loading" class="icon icon-spinner icon-spin icon-lg" />
    <LabeledTooltip
      v-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
    />
  </div>
</template>

<style lang='scss' scoped>
.labeled-select {
  position: relative;

  &.no-label.compact-input {
    ::v-deep .vs__actions:after {
      top: -2px;
    }

    .labeled-container {
      padding: 5px 0 1px 10px;
    }
  }

  &.no-label:not(.compact-input) {
    height: $input-height;
    padding-top: 4px;

    ::v-deep .vs__actions:after {
      top: 0;
    }
  }

  .icon-spinner {
    position: absolute;
    left: calc(50% - .5em);
    top: calc(50% - .5em);
  }

  .labeled-container {
    padding: $input-padding-sm 0 0 $input-padding-sm;

    label {
      margin: 0;
    }

    .selected {
      background-color: transparent;
    }
  }

  &.view {
    &.labeled-input {
      .labeled-container {
        padding: 0;
      }
    }
  }

  &.taggable.compact-input {
    min-height: $unlabeled-input-height;
    ::v-deep .vs__selected-options {
      padding-top: 8px !important;
    }
  }

  &.taggable:not(.compact-input) {
    min-height: $input-height;
    ::v-deep .vs__selected-options {
      // Need to adjust margin when there is a label in the control to add space between the label and the tags
      margin-top: 0px;
    }
  }

  &:not(.taggable) {
    ::v-deep .vs__selected-options {
      // Ensure whole select is clickable to close the select when open
      .vs__selected {
        width: 100%;
      }
    }
  }

  &.taggable {
    ::v-deep .vs__selected-options {
      padding: 3px 0;
      .vs__selected {
        border-color: var(--accent-btn);
        height: 20px;
        min-height: unset !important;
        padding: 0 0 0 7px !important;

        > button {
          height: 20px;
          line-height: 14px;
        }

        > button:hover {
          background-color: var(--primary);
          border-radius: 0;

          &::after {
            color: #fff;
          }
        }
      }
    }
  }

  ::v-deep .vs__selected-options {
    margin-top: -5px;
  }

  ::v-deep .v-select:not(.vs--single) {
    .vs__selected-options {
      padding: 5px 0;
    }
  }

  ::v-deep .vs__actions {
    &:after {
      line-height: 1.85rem;
      position: relative;
      right: 3px;
      top: -10px;
    }
  }

  ::v-deep .v-select.vs--open {
    .vs__dropdown-toggle {
      color: var(--outline) !important;
    }
  }

  ::v-deep &.disabled {
    .labeled-container,
    .vs__dropdown-toggle,
    input,
    label {
      cursor: not-allowed;
    }
  }

  .no-label ::v-deep {
    &.v-select:not(.vs--single) {
      min-height: 33px;
    }

    &.selected {
      padding-top: 8px;
      padding-bottom: 9px;
      position: relative;
      max-height: 2.3em;
      overflow: hidden;
    }

    .vs__selected-options {
      padding: 8px 0 7px 0;
    }
  }
}

// Styling for option group badge
.vs__dropdown-menu .vs__dropdown-option .vs__option-kind-group {
  display: flex;
  > b {
    flex: 1;
  }
  > div {
    background-color: var(--primary);
    border-radius: 4px;
    color: var(--primary-text);
    font-size: 12px;
    height: 18px;
    line-height: 18px;
    margin-top: 1px;
    padding: 0 10px;
  }
}
</style>
