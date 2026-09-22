<script>
import { RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator } from '@components/RcDropdown';
import IconOrSvg from '@shell/components/IconOrSvg';

/**
 * The bulk actions for the rows a table has selected, as one "N Selected" menu.
 *
 * Replaces the row of individual action buttons while the table views toolbar is in use: the
 * toolbar's own row is where the filter lives, so the actions collapse into a single button that
 * is only there when there is a selection to act on.
 */
export default {
  name: 'TableSelectionActions',

  emits: ['click', 'mouseover', 'mouseleave'],

  components: {
    IconOrSvg, RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator
  },

  props: {
    /**
     * The table's availableActions - `{ action, label, icon, enabled }`
     */
    actions: {
      type:    Array,
      default: () => []
    },

    count: {
      type:    Number,
      default: 0
    },

    actionTooltip: {
      type:    [String, Object],
      default: null
    },

    testid: {
      type:    String,
      default: 'sortable-table'
    },
  },

  computed: {
    /**
     * Removing rows is the one action that can't be undone, so it sits on its own below a
     * separator rather than in amongst the rest
     */
    deleteAction() {
      return this.actions.find((act) => act.action === 'promptRemove') ||
        this.actions.find((act) => (act.icon && `${ act.icon }`.includes('icon-trash')) || /delete|remove/i.test(act.action || '')) ||
        null;
    },

    menuActions() {
      const del = this.deleteAction;

      return this.actions.filter((act) => !del || act.action !== del.action);
    },
  },

  methods: {
    apply(act, event) {
      this.$emit('click', act, null, event);
    },
  }
};
</script>

<template>
  <rc-dropdown
    v-if="count"
    :distance="4"
    placement="bottom-start"
  >
    <rc-dropdown-trigger
      variant="primary"
      size="medium"
      class="selection-trigger"
      :data-testid="`${ testid }-selection-actions`"
    >
      {{ t('tableViews.bulk.selected', { count }) }}
      <template #after>
        <i class="icon icon-chevron-down" />
      </template>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <rc-dropdown-item
        v-for="(act, i) in menuActions"
        :key="i"
        v-clean-tooltip="{ content: actionTooltip, placement: 'right' }"
        :disabled="!act.enabled"
        :data-testid="`${ testid }-selection-action-${ act.action }`"
        @click="apply(act, $event)"
        @mouseover="$emit('mouseover', act)"
        @mouseleave="$emit('mouseleave', null)"
      >
        <template #before>
          <!-- An action's icon is a font class or an svg the extension supplied. This is the one
               component that draws either, which is how the row action menu draws them too. -->
          <IconOrSvg
            v-if="act.icon || act.svg"
            :icon="act.icon"
            :src="act.svg"
            class="icon"
          />
        </template>
        <span v-clean-html="act.label" />
      </rc-dropdown-item>

      <template v-if="deleteAction">
        <rc-dropdown-separator v-if="menuActions.length" />
        <rc-dropdown-item
          v-clean-tooltip="{ content: actionTooltip, placement: 'right' }"
          :disabled="!deleteAction.enabled"
          :data-testid="`${ testid }-selection-action-delete`"
          @click="apply(deleteAction, $event)"
          @mouseover="$emit('mouseover', deleteAction)"
          @mouseleave="$emit('mouseleave', null)"
        >
          <template #before>
            <IconOrSvg
              :icon="deleteAction.icon || 'icon icon-delete'"
              :src="deleteAction.svg"
              class="icon"
            />
          </template>
          <span>{{ t('tableViews.bulk.deleteSelected') }}</span>
        </rc-dropdown-item>
      </template>
    </template>
  </rc-dropdown>
</template>

<style lang="scss" scoped>
.selection-trigger {
  white-space: nowrap;
}
</style>
