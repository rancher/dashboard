<script lang="ts">
import Vue from 'vue';

type Error = 'duplicate' | 'empty';

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

function findIndex(items: string[], item: string, trim = true) {
  return items.indexOf(trim ? item?.trim() : item);
}

function findDuplicates(items: string[], caseSensitive = true) {
  return items.filter((item, idx) => {
    const index = findIndex(
      items.map(i => (caseSensitive ? i : i.toLowerCase()).trim()),
      (caseSensitive ? item : item.toLowerCase()),
    );

    return idx !== index;
  }).length > 0;
}

/**
 * Manage a list of strings
 */
export default Vue.extend({
  name:  'string-list',
  props: {
    /**
     * The items source
     */
    items: {
      type: Array,
      default() {
        return [];
      },
    },
    /**
     * The caseSensitive option when create or edit items
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
    messages: {
      type: Object,
      default() {
        return { duplicate: 'Error, item is duplicate!' };
      },
    },
  },
  data() {
    return {
      value:        null as string | null,
      selected:     null as string | null,
      isEditItem:   null as string | null,
      isCreateItem: false,
      errors:       { duplicate: false } as Record<Error, boolean>,
    };
  },

  computed: {

    /**
     * Create an array of error messages, one for each current error
     */
    errorMessages(): string[] {
      return Object
        .keys(this.errors)
        .filter(f => !!(this.errors)[f as Error])
        .map(k => this.messages[k]);
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
  },

  methods: {
    onChange(value: string) {
      this.value = value;
      /**
       * Remove duplicate error when a new value is typed
       */
      this.toggleError(
        'duplicate',
        false,
        this.isCreateItem ? INPUT.create : INPUT.edit,
      );
    },

    onSelect(item: string) {
      if (this.isCreateItem || this.isEditItem === item) {
        return;
      }
      this.selected = item;
    },

    onSelectNext(arrow: Arrow) {
      const index = findIndex(
        this.items as string[],
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

    onSelectLeave() {
      this.selected = null;
    },

    onClickEmptyBody() {
      if (!this.isCreateItem && !this.isEditItem) {
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
      if (this.isEditItem) {
        this.toggleEditMode(false);

        return;
      }
      if (this.selected) {
        const index = this.deleteItem(this.selected);

        if (index !== -1) {
          /**
           * Select the next item in the list when an item is deleted.
           * If the deleted item was the last item, select the previous item (this.items[index - 1]). 
           */
          setTimeout(() => {
            const item = (this.items[index] || this.items[index - 1]) as string;

            this.onSelect(item);
            this.setFocus(item);
          }, 100);
        }
      }
    },

    setFocus(refId: string) {
      setTimeout(() => {
        this.getRef(refId)?.focus();
      }, 0);
    },

    /**
     * Move scrollbar when the selected item is over the top or bottom side of the box
     */
    moveScrollbar(arrow: Arrow, value = 25) {
      const box = this.getRef(BOX);
      const item = this.getRef(this.selected || '');

      if (box && item && item.className === CLASS.item) {
        const boxRect = box.getClientRects()[0];
        const itemRect = item.getClientRects()[0];

        if (
          (arrow === 'down' && itemRect.bottom > boxRect.bottom) ||
          (arrow === 'up' && itemRect.top < boxRect.top)
        ) {
          box.scrollBy({ top: value * DIRECTION[arrow] });
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
      const input = this.getRef(refId);

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
    toggleCreateMode(v: boolean) {
      if (v) {
        this.value = '';
        this.moveScrollbar('down', 1000);

        this.isCreateItem = true;
        this.setFocus(INPUT.create);
      } else {
        this.value = null;
        this.toggleError('duplicate', false);
        this.onSelectLeave();

        this.isCreateItem = false;
      }
    },

    /**
     * Show/Hide the in-line editing to edit an existing item
     */
    toggleEditMode(v: boolean, item?: string) {
      if (v) {
        this.toggleCreateMode(false);
        this.value = this.isEditItem;

        this.isEditItem = item || '';
        this.setFocus(INPUT.edit);
      } else {
        this.value = null;
        this.toggleError('duplicate', false);
        this.onSelectLeave();

        this.isEditItem = null;
      }
    },

    getRef(id: string) {
      const ref = this.$refs[id];

      return (Array.isArray(ref) ? ref[0] : ref) as HTMLElement;
    },

    /**
     * Create a new item and insert in the items list
     */
    saveItem() {
      if (this.value) {
        const items = [
          ...this.items,
          this.value.trim(),
        ] as string[];

        if (findDuplicates(items, this.caseSensitive)) {
          this.toggleError('duplicate', true, INPUT.create);

          return;
        }

        this.updateItems(items);
      }
      this.toggleCreateMode(false);
    },

    /**
     * Update an existing item in the items list
     */
    updateItem(item: string) {
      if (this.value) {
        const items = [...this.items] as string[];
        const index = findIndex(items, item, false);

        if (index !== -1) {
          items[index] = this.value.trim();
        }

        if (findDuplicates(items, this.caseSensitive)) {
          this.toggleError('duplicate', true, INPUT.edit);

          return;
        }

        this.updateItems(items);
      }
      this.toggleEditMode(false);
    },

    /**
     * Delete item and update items list
     */
    deleteItem(item?: string): number {
      let index = -1;

      if (item) {
        index = findIndex(this.items as string[], item, false);
        const items = this.items.filter(f => f !== item) as string[];

        this.updateItems(items);
      }

      return index;
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
      class="string-list-box"
      tabindex="0"
      @focusout.prevent="onSelectLeave()"
      @dblclick="onClickEmptyBody()"
    >
      <div
        v-for="item in items"
        :key="item"
        :ref="item"
        :class="{
          selected: selected === item,
          readonly
        }"
        class="item"
        tabindex="0"
        @click.stop="onSelect(item)"
        @dblclick.stop="toggleEditMode(true, item)"
        @keydown.down.prevent="onSelectNext('down')"
        @keydown.up.prevent="onSelectNext('up')"
      >
        <span
          v-if="!isEditItem || isEditItem !== item"
          class="label"
        >
          {{ item }}
        </span>
        <input
          v-if="isEditItem && isEditItem === item"
          ref="item-edit"
          class="edit-input"
          :value="value != null ? value : item"
          @input.prevent="onChange($event.target.value)"
          @blur.prevent="toggleEditMode(false)"
          @keydown.enter.prevent="updateItem(item)"
        />
      </div>
      <div
        v-if="isCreateItem"
        class="item-create"
      >
        <input
          ref="item-create"
          type="text"
          class="create"
          :placeholder="placeholder"
          @input.prevent="onChange($event.target.value)"
          @keydown.enter.prevent="saveItem"
        />
      </div>
    </div>
    <div
      v-if="!readonly"
      class="string-list-footer"
      :class="{[actionsPosition]: true }"
    >
      <div class="action-buttons">
        <button
          class="btn btn-sm role-tertiary add-button"
          @mousedown.prevent="onClickMinusButton"
        >
          <span class="icon icon-minus icon-sm" />
        </button>
        <button
          class="btn btn-sm role-tertiary remove-button"
          :disabled="isCreateItem"
          @click.prevent="onClickPlusButton"
        >
          <span class="icon icon-plus icon-sm" />
        </button>
      </div>
      <div class="messages">
        <i v-if="errorMessages.length > 0" class="icon icon-warning icon-lg" />
        <span
          v-for="(msg, idx) in errorMessages"
          :key="idx"
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

  input {
    border-radius: 0;
    &.error {
      border: none !important;
      box-shadow: 0 0 0 var(--outline-width) var(--error);
    }
  }

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

    * {
      height: 25px;
      padding: 3px;
    }

    span {
      padding-top: 0;
    }

    input {
      padding-top: 1px;
    }

    .item {
      outline: none;

      &.selected {
        background: var(--primary);
      }

      &.readonly {
        pointer-events: none;
      }

      .label {
        display: block;
        width: auto;
        user-select: none;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .item-create {
      margin-bottom: 7px;
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

      button {
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
</style>
