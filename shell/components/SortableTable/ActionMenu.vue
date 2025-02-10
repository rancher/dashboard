<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

import { isAlternate } from '@shell/utils/platform';
import { RcDropdownMenu } from '@components/RcDropdown';

const store = useStore();

const options = computed(() => store.getters['action-menu/optionsArray']);

const props = defineProps < { resource: Object }>();

const openChanged = (event: boolean) => {
  if (event) {
    store.dispatch('action-menu/setResource', props.resource);
  }
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
  <rc-dropdown-menu
    button-role="link"
    button-size="small"
    :button-aria-label="t('nav.actionMenu.button.label')"
    :dropdown-aria-label="t('nav.actionMenu.label')"
    :options="options"
    @update:open="openChanged"
    @select="(e: MouseEvent, option: object) => execute(option, e)"
  />
</template>
