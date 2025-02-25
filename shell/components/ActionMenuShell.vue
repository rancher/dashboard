<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { isAlternate } from '@shell/utils/platform';
import { RcDropdownMenu } from '@components/RcDropdown';
import { ButtonRoleProps, ButtonSizeProps } from '@components/RcButton/types';
import { DropdownOption } from '@components/RcDropdown/types';

const store = useStore();

type RcDropdownMenuComponentProps = {
  buttonRole?: keyof ButtonRoleProps;
  buttonSize?: keyof ButtonSizeProps;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
  dataTestid?: string;
  resource: Object;
  customActions?: DropdownOption[];
}

const props = defineProps <RcDropdownMenuComponentProps>();

const openChanged = (event: boolean) => {
  if (event) {
    store.dispatch('action-menu/setResource', props.resource);
  }
};

const emit = defineEmits<{(event: string, payload: any): void}>();
const route = useRoute();

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
  } else if (props.customActions) {
    // If the state of this component is controlled
    // by props instead of Vuex, we assume you wouldn't want
    // the mutation to have a dependency on Vuex either.
    // So in that case we use events to execute actions instead.
    // If an action list item is clicked, this
    // component emits that event, then we assume the parent
    // component will execute the action.
    emit(
      action.action,
      {
        action,
        event,
        ...args,
        route,
      }
    );
  } else {
    // If the state of this component is controlled
    // by Vuex, mutate the store when an action is clicked.
    const opts = { alt: isAlternate(event) };

    store.dispatch('action-menu/execute', {
      action, args, opts
    });
  }
};

const options = computed(() => store.getters['action-menu/optionsArray']);

const menuOptions = () => {
  if (props.customActions && props.customActions.length > 0) {
    return props.customActions;
  }

  return options.value;
};
</script>

<template>
  <rc-dropdown-menu
    :button-role="buttonRole || 'link'"
    :button-size="buttonSize || 'small'"
    :button-aria-label="buttonAriaLabel"
    :dropdown-aria-label="dropdownAriaLabel"
    :options="menuOptions()"
    :data-testid="dataTestid"
    @update:open="openChanged"
    @select="(e: MouseEvent, option: object) => execute(option, e)"
  />
</template>
