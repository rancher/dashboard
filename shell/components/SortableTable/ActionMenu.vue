<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

import IconOrSvg from '@shell/components/IconOrSvg';
import { isAlternate } from '@shell/utils/platform';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const store = useStore();

const options = computed(() => store.getters['action-menu/options']);

const props = defineProps < { resource: Object }>();

const openChanged = () => {
  store.dispatch('action-menu/setResource', props.resource);
};

const execute = (action: any, event: MouseEvent, args?: any) => {
  if (action.disabled) {
    return;
  }

  // this will come from extensions...
  if (action.invoke) {
    const fn = action.invoke;

    if (fn && action.enabled) {
      const resources = store.getters['action-menu/resources'];
      const opts = {
        event,
        action,
        isAlt: isAlternate(event)
      };

      if (resources.length === 1) {
        fn.apply(this, [opts, resources]);
      }
    }
  } else {
    // If the state of this component is controlled
    // by Vuex, mutate the store when an action is clicked.
    const opts = { alt: isAlternate(event) };

    store.dispatch('action-menu/execute', {
      action, args, opts
    });
  }
};
</script>

<template>
  <rc-dropdown
    :aria-label="t('nav.actionMenu.label')"
    @update:open="openChanged"
  >
    <rc-dropdown-trigger
      link
      small
      data-testid="page-actions-menu"
      :aria-label="t('nav.actionMenu.button.label')"
    >
      <i class="icon icon-actions" />
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <template
        v-for="(a) in options"
        :key="a.label"
      >
        <rc-dropdown-item
          v-if="!a.divider"
          @click="(e: MouseEvent) => execute(a, e)"
        >
          <template #before>
            <IconOrSvg
              v-if="a.icon || a.svg"
              :icon="a.icon"
              :src="a.svg"
              class="icon"
              color="header"
            />
          </template>
          {{ a.labelKey ? t(a.labelKey) : a.label }}
        </rc-dropdown-item>
        <rc-dropdown-separator
          v-else
        />
      </template>
    </template>
  </rc-dropdown>
</template>
