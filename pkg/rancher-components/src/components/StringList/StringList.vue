<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { findStringIndex, hasDuplicatedStrings } from '@shell/utils/array';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

type Error = 'duplicate';
type ErrorMessages = Record<Error, string>;

type Arrow = 'up' | 'down';

const DIRECTION: Record<Arrow, number> = {
  up:   -1,
  down: 1,
};

const INPUT = {
  create: 'item-create',
  edit:   'item-edit',
};

const BOX = 'box';

const CLASS = {
  item:  'item',
  error: 'error',
};

/**
 * Manage a list of strings
 */
export default defineComponent({
  name:       'StringList',
  components: { LabeledInput },
  props:      {
    /**
     * The items source
     */
    items: {
      type:    Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * Determines if items with same text will be treated differently, depending on the letters case
     * It is used to compare items during create/edit actions and detect duplicates.
     */
    caseSensitive: {
      type:    Boolean,
      default: false,
    },
    /**
     * Determines if the list of items is editable or view-only
     */
    readonly: {
      type:    Boolean,
      default: false,
    },
    /**
     * The placeholder to show in input field when create or edit items
     */
    placeholder: {
      type:    String,
      default: null,
    },
    /**
     * Determines the action buttons position at the bottom of the main box
     */
    actionsPosition: {
      type:    String,
      default: 'right',
    },
    /**
     * Custom Error messages
     */
    errorMessages: {
      type:    Object as PropType<ErrorMessages>,
      default: () => ({} as ErrorMessages),
    },
    /**
     * Enables bulk addition and defines the delimiter to split the input string.
     */
    bulkAdditionDelimiter: {
      type:    RegExp,
      default: null,
    }
  },

  emits: ['type:item', 'errors', 'change', 'update:value', 'blur', 'update:validation'],

  data() {
    return {
      value:        undefined as string | undefined,
      selected:     null as string | null,
      editedItem:   undefined as string | undefined,
      isCreateItem: false,
      errors:       { duplicate: false } as Record<Error, boolean>
    };
  },

  computed: {

    /**
     * Create an array of error messages, one for each current error
     */
    errorMessagesArray(): string[] {
      return (Object.keys(this.errors) as Error[])
        .filter((f) => this.errors[f] && this.errorMessages[f])
        .map((k) => this.errorMessages[k]);
    },
  },

  watch: {
    /**
     * Shutdown any user actions on the component when it becomes readonly
     */
    readonly() {
      this.toggleEditMode(false);
      this.toggleCreateMode(false);
    },
    value(val) {
      this.$emit('type:item', val);
    },
    errors: {
      handler(val) {
        this.$emit('errors', val);
      },
      deep: true
    }
  },

  methods: {
    onChange(value: string, index?: number) {
      this.value = value;
      const items = this.addValueToItems(this.items, value, index);

      this.toggleError(
        'duplicate',
        hasDuplicatedStrings(items, this.caseSensitive),
        this.isCreateItem ? INPUT.create : INPUT.edit
      );
    },

    onSelect(item: string) {
      if (this.readonly || this.isCreateItem || this.editedItem === item) {
        return;
      }
      this.selected = item;
    },

    onSelectNext(arrow: Arrow) {
      const index = findStringIndex(
        this.items,
        this.selected as string,
      );

      if (index !== -1) {
        /**
         * Select next item in the arrow's direction if it exists,
         * else select again this.selected (do nothing)
         */
        const item = (this.items[index + DIRECTION[arrow]] || this.selected) as string;

        this.onSelect(item);
        this.moveScrollbar(arrow);
      }
    },

    onSelectLeave(item?: string) {
      if (item === this.selected) {
        this.selected = null;
      }
    },

    onClickEmptyBody() {
      if (!this.isCreateItem && !this.editedItem) {
        this.toggleCreateMode(true);
      }
    },

    onClickPlusButton() {
      this.onSelectLeave();
      this.toggleCreateMode(true);
    },

    onClickMinusButton() {
      if (this.isCreateItem) {
        this.toggleCreateMode(false);

        return;
      }
      if (this.editedItem) {
        this.deleteAndSelectNext(this.editedItem);
        this.toggleEditMode(false);

        return;
      }
      if (this.selected) {
        this.deleteAndSelectNext(this.selected);
      }
    },

    deleteAndSelectNext(currItem: string) {
      const index = findStringIndex(this.items, currItem, false);

      if (index !== -1) {
        /**
         * Select the next item in the list.
         */
        const item = (this.items[index + 1] || this.items[index - 1]);

        this.onSelect(item);
        this.setFocus(item);

        this.deleteItem(this.items[index]);
      }
    },

    setFocus(refId: string) {
      this.$nextTick(() => (this.getElemByRef(refId) as HTMLElement)?.focus());
    },

    /**
     * Move scrollbar when the selected item is over the top or bottom side of the box
     */
    moveScrollbar(arrow: Arrow, value?: number) {
      const box = this.getElemByRef(BOX) as HTMLElement;
      const item = this.getElemByRef(this.selected || '') as HTMLElement;

      if (box && item && item.className.includes(CLASS.item)) {
        const boxRect = box.getClientRects()[0];
        const itemRect = item.getClientRects()[0];

        if (
          (arrow === 'down' && itemRect.bottom > boxRect.bottom) ||
          (arrow === 'up' && itemRect.top < boxRect.top)
        ) {
          const top = (value ?? itemRect.height) * DIRECTION[arrow];

          box.scrollBy({ top });
        }
      }
    },

    /**
     * Set an error and eventually assign an error class to the element
     */
    toggleError(type: Error, val: boolean, refId?: string) {
      this.errors[type] = val;

      if (refId) {
        this.toggleErrorClass(refId, val);
      }
    },

    toggleErrorClass(refId: string, val: boolean) {
      const input = (this.getElemByRef(refId))?.$el;

      if (input) {
        if (val) {
          input.classList.add(CLASS.error);
        } else {
          input.classList.remove(CLASS.error);
        }
      }
    },

    /**
     * Show/Hide the input line to create new item
     */
    toggleCreateMode(show: boolean) {
      if (this.readonly) {
        return;
      }
      if (show) {
        this.toggleEditMode(false);
        this.value = '';

        this.isCreateItem = true;
        this.setFocus(INPUT.create);
      } else {
        this.value = undefined;
        this.toggleError('duplicate', false);
        this.onSelectLeave();

        this.isCreateItem = false;
      }
    },

    /**
     * Show/Hide the in-line editing to edit an existing item
     */
    toggleEditMode(show: boolean, item?: string) {
      if (this.readonly) {
        return;
      }
      if (show) {
        this.toggleCreateMode(false);
        this.value = this.editedItem;

        this.editedItem = item || '';
        this.setFocus(INPUT.edit);
      } else {
        this.value = undefined;
        this.toggleError('duplicate', false);
        this.onSelectLeave();

        this.editedItem = undefined;
      }
    },

    getElemByRef(id: string) {
      const ref = this.$refs[id];

      return Array.isArray(ref) ? ref[0] : ref;
    },

    /**
     * Create a new item and insert in the items list
     */
    saveItem(closeInput = true) {
      const value = this.value?.trim();

      if (value) {
        const items = this.addValueToItems(this.items, value);

        if (!hasDuplicatedStrings(items, this.caseSensitive)) {
          this.updateItems(items);
        }
      }

      if (closeInput) {
        this.toggleCreateMode(false);
      }
    },

    /**
     * Update an existing item in the items list
     */
    updateItem(item: string, closeInput = true) {
      const value = this.value?.trim();

      if (value) {
        const index = findStringIndex(this.items, item, false);
        const items = index !== -1 ? this.addValueToItems(this.items, value, index) : this.items;

        if (!hasDuplicatedStrings(items, this.caseSensitive)) {
          this.updateItems(items);
        }
      }

      if (closeInput) {
        this.toggleEditMode(false);
      }
    },

    /**
     * Add a new or update an exiting item in the items list.
     *
     * @param items The current items list.
     * @param value The new value to be added.
     * @param index The list index of the item to be updated (optional).
     * @returns Updated items list.
     */
    addValueToItems(items: string[], value: string, index?: number): string[] {
      const updatedItems = [...items];

      // Add new item
      if (index === undefined) {
        if (this.bulkAdditionDelimiter && value.search(this.bulkAdditionDelimiter) >= 0) {
          updatedItems.push(...this.splitBulkValue(value));
        } else {
          updatedItems.push(value);
        }
      } else { // Update existing item
        if (this.bulkAdditionDelimiter && value.search(this.bulkAdditionDelimiter) >= 0) {
          updatedItems.splice(index, 1, ...this.splitBulkValue(value));
        } else {
          updatedItems[index] = value;
        }
      }

      return updatedItems;
    },

    /**
     * Split the value by the defined delimiter and remove empty strings.
     *
     * @param value The value to be split.
     * @returns Array containing split values.
     */
    splitBulkValue(value: string): string[] {
      return value
        .split(this.bulkAdditionDelimiter)
        .filter((item) => {
          return item.trim().length > 0;
        });
    },

    /**
     * Remove an item from items list
     */
    deleteItem(item?: string) {
      const items = this.items.filter((f) => f !== item);

      this.updateItems(items);
    },

    /**
     * Update items list and emit to parent component
     */
    updateItems(items: string[]) {
      this.$emit('change', items);
    },
  },
});
</script>

<template>
  <div
    class="string-list"
    :class="{ readonly }"
  >
    <div
      ref="box"
      data-testid="div-string-list-box"
      class="string-list-box"
      tabindex="0"
      @dblclick="onClickEmptyBody()"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        :ref="item"
        :class="{
          selected: selected === item,
          readonly
        }"
        :data-testid="`div-item-${item}`"
        class="item static"
        tabindex="0"
        @mousedown="onSelect(item)"
        @dblclick.stop="toggleEditMode(true, item)"
        @keydown.down.prevent="onSelectNext('down')"
        @keydown.up.prevent="onSelectNext('up')"
        @blur="onSelectLeave(item)"
      >
        <span
          v-if="!editedItem || editedItem !== item"
          class="label static"
        >
          {{ item }}
        </span>
        <LabeledInput
          v-if="editedItem && editedItem === item"
          ref="item-edit"
          :data-testid="`item-edit-${item}`"
          class="edit-input static"
          :value="value != null ? value : item"
          @update:value="onChange($event, index)"
          @blur.prevent="updateItem(item)"
          @keydown.enter="updateItem(item, !errors.duplicate)"
        />
      </div>
      <div
        v-if="isCreateItem"
        class="create-field static"
      >
        <LabeledInput
          ref="item-create"
          data-testid="item-create"
          class="create-input static"
          type="text"
          :value="value"
          :placeholder="placeholder"
          @update:value="onChange($event)"
          @blur.prevent="saveItem"
          @keydown.enter="saveItem(!errors.duplicate)"
        />
      </div>
    </div>
    <div
      v-if="!readonly"
      class="string-list-footer"
      :class="{[actionsPosition]: true }"
    >
      <div
        data-testid="div-action-buttons"
        class="action-buttons"
      >
        <button
          data-testid="button-remove"
          class="btn btn-sm role-tertiary remove-button"
          :disabled="!selected && !isCreateItem && !editedItem"
          @mousedown.prevent="onClickMinusButton"
        >
          <span class="icon icon-minus icon-sm" />
        </button>
        <button
          data-testid="button-add"
          class="btn btn-sm role-tertiary add-button"
          :disabled="!!isCreateItem || !!editedItem"
          @click.prevent="onClickPlusButton"
        >
          <span class="icon icon-plus icon-sm" />
        </button>
      </div>
      <div class="messages">
        <i
          v-if="errorMessagesArray.length > 0"
          data-testid="i-warning-icon"
          class="icon icon-warning icon-lg"
        />
        <span
          v-for="(msg, idx) in errorMessagesArray"
          :key="idx"
          :data-testid="`span-error-message-${msg}`"
          class="error"
        >
          {{ idx > 0 ? '; ' : '' }}
          {{ msg }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.string-list {
  display: flex;
  flex-direction: column;
  width: auto;

  &.readonly {
    cursor: default;
    opacity: 0.4;
  }

  .string-list-box {
    min-height: 200px;
    height: 100%;
    outline: none;
    overflow-y: auto;
    overflow-x: hidden;
    border: solid var(--border-width) var(--input-border);
    padding-top: 3px;

    .static {
      height: 25px;
      padding: 3px;
    }

    .item {
      outline: none;

      &.selected {
        background: var(--primary);
        color: var(--primary-hover-text);
      }

      &.readonly {
        pointer-events: none;
      }

      .label {
        display: block;
        width: auto;
        user-select: none;
        overflow: hidden;
        white-space: no-wrap;
        text-overflow: ellipsis;
        padding-top: 1px;
      }
    }

    .create-field {
      padding-top: 1px;
      margin-bottom: 7px;
    }

    .labeled-input {
      padding-top: 0;
      padding-bottom: 0;
      border-radius: 0;
      &.error {
        border: none;
        box-shadow: 0 0 0 var(--outline-width) var(--error);
      }
    }
  }

  .string-list-footer {
    --footer-height: 28px;
    height: var(--footer-height);
    margin-top: 5px;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;

    &.left {
      flex-direction: row;
    }

    &.right {
      flex-direction: row-reverse;
    }

    .action-buttons {
      display: flex;
      flex-direction: row-reverse;
      gap: 0.5rem;

      .btn {
        min-height: var(--footer-height);
        line-height: 0;
        border-radius: 2px;

        &:disabled {
          cursor: default;
          pointer-events: none;
        }
      }
    }

    .messages {
      line-height: var(--footer-height);

      .error, .icon-warning {
        color: var(--error);
        line-height: inherit;
      }
    }
  }
}

:deep() {
  .labeled-input INPUT.no-label,
  .labeled-input INPUT:hover.no-label,
  .labeled-input INPUT:focus.no-label {
    padding: 1px 0px 0px 0px;
  }
  .labeled-input.compact-input {
    min-height: 0;
  }
}
</style>
