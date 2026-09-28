<script setup lang="ts">
/**
 * The way out of this cluster's events to the full list, with the row count beside it.
 *
 * Its own component only because it has two homes: above the table when the improved tables
 * feature gives that table a toolbar of its own, and inside the table's header row when it does
 * not. Written twice it would be two things to keep in step.
 */
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';

import { RcDropdown, RcDropdownTrigger, RcDropdownItem } from '@components/RcDropdown';
import { useI18n } from '@shell/composables/useI18n';

defineProps<{
  /** Where the "Events" link goes - the full event list */
  to: RouteLocationRaw,
  /** The row counts on offer, as { label, value } */
  options: { label: string, value: number }[],
  /** The count currently in force, so it can be ticked */
  rowsPerPage: number,
}>();

const emit = defineEmits<{ 'update:rowsPerPage': [value: number] }>();

const { t } = useI18n(useStore());
</script>

<template>
  <div class="events-table-link">
    <router-link
      data-testid="events-link"
      :to="to"
      class="events-link"
    >
      <span>{{ t('glance.eventsTable') }}</span>
    </router-link>
    <rc-dropdown>
      <rc-dropdown-trigger
        data-testid="events-list-row-count-menu-toggle"
        :aria-label="t('glance.changeEventsListRowCount')"
        variant="ghost"
        size="small"
      >
        <i class="icon icon-gear" />
      </rc-dropdown-trigger>
      <template #dropdownCollection>
        <rc-dropdown-item
          v-for="(item, i) in options"
          :key="i"
          :value="item.value"
          @click.stop="emit('update:rowsPerPage', item.value)"
        >
          <span :class="{ 'selected-pagesize-option': rowsPerPage === item.value }">
            {{ item.label }}
          </span>
        </rc-dropdown-item>
      </template>
    </rc-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.events-table-link {
  display: flex;
  align-items: center;
}

.icon.icon-gear {
  color: var(--primary);
  padding: 0 8px;
}

.events-link {
  align-self: center;
  margin-right: 10px;
  white-space: nowrap;
}

.selected-pagesize-option {
  font-weight: bold;
}
</style>
