<script>
import CompactInput from '@shell/mixins/compact-input';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import { get } from '@shell/utils/object';
import { LabeledTooltip } from '@components/LabeledTooltip';
import VueSelectOverrides from '@shell/mixins/vue-select-overrides';
import { onClickOption, calculatePosition } from '@shell/utils/select';
import { generateRandomAlphaString } from '@shell/utils/string';
import LabeledSelectPagination from '@shell/components/form/labeled-select-utils/labeled-select-pagination';
import { LABEL_SELECT_NOT_OPTION_KINDS } from '@shell/types/components/labeledSelect';
import { mapGetters } from 'vuex';

export default {
  name: 'LabeledSelect',

  inheritAttrs: false,

  components: { LabeledTooltip },
  mixins:     [
    CompactInput,
    LabeledFormElement,
    VueSelectOverrides,
    LabeledSelectPagination
  ],

  emits: ['on-open', 'on-close', 'selecting', 'deselecting', 'search', 'update:validation', 'update:value'],

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
    required: {
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
    selectable: {
      default: (opt) => {
        if ( opt ) {
          if ( opt.disabled || LABEL_SELECT_NOT_OPTION_KINDS.includes(opt.kind) || opt.loading ) {
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
    options: {
      type:    Array,
      default: () => ([])
    },
    closeOnSelect: {
      type:    Boolean,
      default: true
    },
    noOptionsLabelKey: {
      type:    String,
      default: 'labelSelect.noOptions.empty'
    }
  },

  data() {
    return {
      selectedVisibility: 'visible',
      shouldOpen:         true,
      uid:                generateRandomAlphaString(10)
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    hasLabel() {
      return this.isCompact ? false : !!this.label || !!this.labelKey || !!this.$slots.label;
    },

    hasGroupIcon() {
      // Required for option.icon. Note that we only apply if paginating as well (there might be 2 x performance issues with 2k entries. one to iterate through this list, the other with conditional class per entry in dom)
      return this.canPaginate ? !!this._options.find((o) => o.kind === 'group' && !!o.icon) : false;
    },

    _options() {
      // If we're paginated show the page as provided by `paginate`. See label-select-pagination mixin
      return this.canPaginate ? this.page : this.options;
    },

    filteredAttrs() {
      const {
        class: _class,
        ...rest
      } = this.$attrs;

      return rest;
    },

    // update placeholder text to inform user they can add their own opts when none are found
    showTagPrompts() {
      return !this.options.length && this.$attrs.taggable && this.isSearchable;
    }
  },

  methods: {
    // resizeHandler = in mixin
    focusSearch(ev) {
      if (this.isView || this.disabled || this.loading) {
        return;
      }

      const searchBox = document.querySelector('.vs__search');

      // added to mitigate https://github.com/rancher/dashboard/issues/14361
      if (!this.isSearchable || (searchBox && document.activeElement && !searchBox.contains(document.activeElement))) {
        ev.preventDefault();
      }

      // we need this override as in a "closeOnSelect" type of component
      // if we don't have this override, it would open again
      if (this.overridesMixinPreventDoubleTriggerKeysOpen) {
        this.$nextTick(() => {
          const el = this.$refs['select'];

          if ( el ) {
            el.focus();
          }

          this.overridesMixinPreventDoubleTriggerKeysOpen = false;
        });

        return;
      }
      this.$refs['select-input'].open = true;

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

    onClose() {
      this.$emit('on-close');
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

    onSearch(newSearchString, loading) {
      if (this.canPaginate) {
        this.setPaginationFilter(newSearchString);
      } else {
        if (newSearchString) {
          this.dropdownShouldOpen(this.$refs['select-input'], true);
        }
      }
      this.$emit('search', newSearchString, loading);
    },

    getOptionKey(opt) {
      if (this.optionKey) {
        return get(opt, this.optionKey);
      }

      return this.getOptionLabel(opt);
    }
  },
};
</script>

<template>
  <div
    ref="select"
    class="labeled-select"
    :class="[
      $attrs.class,
      {
        disabled: isView || disabled,
        focused,
        [mode]: true,
        [status]: status,
        taggable: $attrs.taggable,
        taggable: $attrs.multiple,
        hoverable: hoverTooltip,
        'compact-input': isCompact,
        'no-label': !hasLabel
      }
    ]"
    :tabindex="isView || disabled ? -1 : 0"
    @click="focusSearch"
    @keydown.enter="focusSearch"
    @keydown.down.prevent="focusSearch"
    @keydown.space="focusSearch"
  >
    <div
      :class="{ 'labeled-container': true, raised, empty, [mode]: true }"
      :style="{ border: 'none' }"
    >
      <label
        v-if="hasLabel"
        :id="`labeled-select-uid-${uid}`"
      >
        <t
          v-if="labelKey"
          :k="labelKey"
        />
        <template v-else-if="label">{{ label }}</template>

        <span
          v-if="requiredField"
          class="required"
        >*</span>
      </label>
    </div>
    <v-select
      ref="select-input"
      :aria-labelledby="hasLabel ? `labeled-select-uid-${uid}` : ''"
      v-bind="filteredAttrs"
      class="inline"
      :append-to-body="appendToBody"
      :calculate-position="positionDropdown"
      :class="{ 'no-label': !(label || '').length}"
      :clearable="clearable"
      :disabled="isView || disabled || loading"
      :get-option-key="getOptionKey"
      :get-option-label="(opt) => getOptionLabel(opt)"
      :label="optionLabel"
      :options="_options"
      :map-keydown="mappedKeys"
      :placeholder="placeholder"
      :reduce="(x) => reduce(x)"
      :filterable="isFilterable"
      :searchable="isSearchable"
      :selectable="selectable"
      :modelValue="value != null && !loading ? value : ''"
      :dropdown-should-open="dropdownShouldOpen"
      :tabindex="-1"
      role="listbox"
      @update:modelValue="$emit('selecting', $event); $emit('update:value', $event)"
      @search:blur="onBlur"
      @search:focus="onFocus"
      @search="onSearch"
      @open="onOpen"
      @close="onClose"
      @option:selecting="$emit('selecting', $event)"
      @option:deselecting="$emit('deselecting', $event)"
    >
      <template #option="option">
        <template v-if="showTagPrompts">
          <div class="only-user-opts">
            {{ t('labeledSelect.pressEnter', {input:getOptionLabel(option.label)}) }}
          </div>
        </template>
        <template v-else-if="option.kind === 'group'">
          <div class="vs__option-kind-group">
            <i
              v-if="option.icon"
              class="icon"
              :class="{ [option.icon]: true}"
            />
            <b>{{ getOptionLabel(option) }}</b>
            <div v-if="option.badge">
              {{ option.badge }}
            </div>
          </div>
        </template>
        <template v-else-if="option.kind === 'divider'">
          <hr>
        </template>
        <template v-else-if="option.kind === 'highlighted'">
          <div class="option-kind-highlighted">
            {{ option.label }}
          </div>
        </template>
        <div
          v-else
          class="vs__option-kind"
          :class="{ 'has-icon' : hasGroupIcon}"
          @mousedown="(e) => onClickOption(option, e)"
        >
          {{ getOptionLabel(option) }}
          <i
            v-if="option.error"
            class="icon icon-warning pull-right"
            style="font-size: 20px;"
          />
        </div>
      </template>
      <!-- Pass down templates provided by the caller -->
      <template
        v-for="(_, slot) of $slots"
        :key="slot"
        #[slot]="scope"
      >
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>

      <template #list-footer>
        <div
          v-if="canPaginate && totalResults && pages > 1"
          class="pagination-slot"
        >
          <div class="load-more">
            <i
              v-if="paginating"
              class="icon icon-spinner icon-spin"
            />
            <div v-else>
              <a
                v-if="canLoadMore"
                @click="loadMore"
              > {{ t('labelSelect.pagination.more') }}</a>
            </div>
          </div>

          <div class="count">
            {{ optionCounts }}
          </div>
        </div>
      </template>
      <template #no-options="{ search }">
        <div class="no-options-slot">
          <template v-if="showTagPrompts">
            <span v-if="!searching">{{ t('labeledSelect.startTyping') }}</span>
          </template>
          <div
            v-else-if="paginating"
            class="paginating"
          >
            <i class="icon icon-spinner icon-spin" />
          </div>
          <template v-else-if="search">
            {{ t('labelSelect.noOptions.noMatch') }}
          </template>
          <template v-else>
            {{ t(noOptionsLabelKey) }}
          </template>
        </div>
      </template>
    </v-select>
    <i
      v-if="loading"
      class="icon icon-spinner icon-spin icon-lg"
    />
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

<style lang='scss' scoped>

.labeled-select {
  position: relative;
  // Prevent namespace field from wiggling or changing
  // height when it is toggled from a LabeledInput to a
  // LabeledSelect.
  padding-bottom: 1px;

  &.no-label.compact-input {
    :deep() .vs__actions:after {
      top: -2px;
    }

    .labeled-container {
      padding: 5px 0 1px 10px;
    }
  }

  &.no-label:not(.compact-input) {
    height: $input-height;
    padding-top: 4px;

    :deep() .vs__actions:after {
      top: 0;
    }
  }

  .icon-spinner {
    position: absolute;
    left: calc(50% - .5em);
    top: calc(50% - .5em);
  }

  .labeled-container {
    // Make LabeledSelect and LabeledInput the same height so they
    // don't wiggle when you toggle between them.
    padding: 7px 0 0 $input-padding-sm;
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
    :deep() .vs__selected-options {
      padding-top: 8px !important;
    }
  }

  &.taggable:not(.compact-input) {
    min-height: $input-height;
    :deep() .vs__selected-options {
      // Need to adjust margin when there is a label in the control to add space between the label and the tags
      margin-top: 0px;
    }
  }

  &:not(.taggable) {
    :deep() .vs__selected-options {
      // Ensure whole select is clickable to close the select when open
      .vs__selected {
        width: 100%;
      }
    }
  }

  &.taggable {
    :deep() .vs__selected-options {
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

  :deep() .vs__selected-options {
    margin-top: -5px;
  }

  :deep() .v-select:not(.vs--single) {
    .vs__selected-options {
      padding: 5px 0;
    }
  }

  :deep() .vs__actions {
    &:after {
      position: relative;
      top: -10px;
    }
  }

  :deep() .v-select.vs--open {
    .vs__dropdown-toggle {
      color: var(--outline) !important;
    }
  }

  :deep() &.disabled {
    .labeled-container,
    .vs__dropdown-toggle,
    input,
    label {
      cursor: not-allowed;
    }
  }

  .no-label :deep() {
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

$icon-size: 18px;

// This represents the drop down area. Note - it might be attached to body and NOT the parent label select div
.vs__dropdown-menu {

  // Styling for individual options
  .vs__dropdown-option .vs__option-kind {
    &-group {
      display: flex;
      align-items: center;

      i { // icon
        width: $icon-size;
      }

      > b { // group label
        flex: 1;
      }

      > div { // badge
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

    &.has-icon {
      padding-left: $icon-size;
    }
  }

    &.has-icon .vs__option-kind div{
    padding-left: $icon-size;
  }

  .pagination-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-top: 5px;

    .load-more {
      display: flex;
      align-items: center;
      height: 19px;

      a {
        cursor: pointer;
      }
    }

    .count {
      position: absolute;
      right: 10px;
    }
  }

  .no-options-slot .paginating {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Styling for option highlighted
.vs__dropdown-option {
  > .option-kind-highlighted {
    color: var(--dropdown-highlight-text);

    &:hover {
      color: var(--dropdown-hover-text);
    }
  }

  &.vs__dropdown-option--selected,
  &.vs__dropdown-option--highlight {
    > .option-kind-highlighted {
      color: var(--dropdown-hover-text);
    }
  }
}

.vs__dropdown-menu .vs__dropdown-option .only-user-opts{
    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    margin: 0px calc(-#{$input-padding-sm}/2);
    padding: 3px 20px;
}
</style>
