<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { isAlternate } from '@shell/utils/platform';
import { RcDropdownMenu } from '@components/RcDropdown';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';
import { DropdownOption } from '@components/RcDropdown/types';

defineOptions({ inheritAttrs: false });

const store = useStore();

type RcDropdownMenuComponentProps = {
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
  dataTestid?: string;
  resource?: Object;
  customActions?: DropdownOption[];
}

const props = defineProps <RcDropdownMenuComponentProps>();

const openChanged = (event: boolean) => {
  if (event) {
    store.dispatch('action-menu/setResource', props.resource);
  }
};

export interface ActionMenuSelection {
  action: string;
  actionData: any;
  event: MouseEvent;
  route: ReturnType<typeof useRoute>;
  [key: string]: any;
}

const emit = defineEmits<{(event: 'action-invoked', payload?: ActionMenuSelection): void;}>();
const route = useRoute();

const execute = (action: any, event: MouseEvent, args?: any) => {
  if (action.disabled) {
    return;
  }

  const payload: ActionMenuSelection = {
    action:     action.action,
    actionData: action,
    event,
    ...args,
    route,
  };

  emit('action-invoked', payload);

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
  } else if (!props.customActions) {
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
    :button-variant="buttonVariant || 'link'"
    :button-size="buttonSize || 'small'"
    :button-aria-label="buttonAriaLabel"
    :dropdown-aria-label="dropdownAriaLabel"
    :options="menuOptions()"
    :data-testid="dataTestid"
    @update:open="openChanged"
    @select="(e: MouseEvent, option: object) => execute(option, e)"
  />
</template>
