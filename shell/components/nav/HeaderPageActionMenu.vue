<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { RcDropdownMenu } from '@components/RcDropdown';

const store = useStore();
const pageActions = computed(() => store.getters.pageActions);
const pageAction = (action: string) => {
  store.dispatch('handlePageAction', action);
};
</script>

<template>
  <rc-dropdown-menu
    :options="pageActions"
    :button-aria-label="t('nav.actionMenu.label')"
    :dropdown-aria-label="t('nav.actionMenu.button.label')"
    button-role="tertiary"
    @select="pageAction"
  />
</template>
