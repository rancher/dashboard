<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const isPageActionMenuOpen = ref(false);

const showPageActionsMenu = (show: boolean) => {
  isPageActionMenuOpen.value = show;
};

const store = useStore();
const pageActions = computed(() => store.getters.pageActions);
const pageAction = (action: string) => {
  store.dispatch('handlePageAction', action);
  showPageActionsMenu(false);
};
</script>

<template>
  <rc-dropdown :aria-label="t('nav.actionMenu.label')">
    <rc-dropdown-trigger
      tertiary
      data-testid="page-actions-menu"
      :aria-label="t('nav.actionMenu.button.label')"
    >
      <i class="icon icon-actions" />
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <template
        v-for="(a) in pageActions"
        :key="a.label"
      >
        <rc-dropdown-item
          v-if="!a.separator"
          @click="pageAction(a)"
        >
          {{ a.labelKey ? t(a.labelKey) : a.label }}
        </rc-dropdown-item>
        <rc-dropdown-separator
          v-else
        />
      </template>
    </template>
  </rc-dropdown>
</template>
