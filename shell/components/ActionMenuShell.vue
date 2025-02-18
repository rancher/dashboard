<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

import { isAlternate } from '@shell/utils/platform';
import { RcDropdownMenu } from '@components/RcDropdown';
import { ButtonRoleProps, ButtonSizeProps } from '@components/RcButton/types';

const store = useStore();

const options = computed(() => store.getters['action-menu/optionsArray']);

type RcDropdownMenuComponentProps = {
  buttonRole?: keyof ButtonRoleProps;
  buttonSize?: keyof ButtonSizeProps;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
  testId?: string;
  resource: Object;
}

const props = defineProps <RcDropdownMenuComponentProps>();

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
    :button-role="buttonRole || 'link'"
    :button-size="buttonSize || 'small'"
    :button-aria-label="buttonAriaLabel"
    :dropdown-aria-label="dropdownAriaLabel"
    :options="options"
    :testId="testId"
    @update:open="openChanged"
    @select="(e: MouseEvent, option: object) => execute(option, e)"
  />
</template>
