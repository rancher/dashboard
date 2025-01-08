<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import RcDropdown from '@shell/components/RcDropdown.vue';
import RcDropdownCollection from '@shell/components/RcDropdownCollection.vue';
import RcDropdownItem from '@shell/components/RcDropdownItem.vue';
import RcDropdownSeparator from '@shell/components/RcDropdownSeparator.vue';
import RcDropdownTrigger from '@shell/components/RcDropdownTrigger.vue';

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
  <rc-dropdown>
    <rc-dropdown-trigger tertiary>
      <i
        data-testid="page-actions-menu"
        class="icon icon-actions"
      />
    </rc-dropdown-trigger>
    <template #popper>
      <rc-dropdown-collection>
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
      </rc-dropdown-collection>
    </template>
  </rc-dropdown>
</template>
