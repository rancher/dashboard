<script setup lang="ts">
/**
 * A button element used for performing actions, such as submitting forms or
 * opening dialogs.
 *
 * Example:
 *
 * <rc-button role="primary" @click="doAction">Perform an Action</rc-button>
 */
import { computed, ref } from 'vue';
import {
  ButtonRoleProps, ButtonSizeProps, ButtonRoleNewProps, ButtonSizeNewProps, ButtonSize
} from './types';

const buttonRoles: { role: keyof ButtonRoleProps, className: string }[] = [
  { role: 'primary', className: 'role-primary' },
  { role: 'secondary', className: 'role-secondary' },
  { role: 'tertiary', className: 'role-tertiary' },
  { role: 'link', className: 'role-link' },
  { role: 'multiAction', className: 'role-multi-action' },
  { role: 'ghost', className: 'role-ghost' },
];

const buttonSizes: { size: keyof ButtonSizeProps, className: string }[] = [
  { size: 'small', className: 'btn-sm' },
];

const buttonSizesNew: { size: ButtonSize, className: string }[] = [
  { size: 'small', className: 'btn-small' },
  { size: 'medium', className: 'btn-medium' },
  { size: 'large', className: 'btn-large' },
];

const props = defineProps<ButtonRoleProps & ButtonSizeProps & ButtonRoleNewProps & ButtonSizeNewProps>();

const activeRoleClassName = computed(() => {
  const activeRole = buttonRoles.find(({ role }) => props[role]);

  if (activeRole) {
    console.warn(
      `[RcButton] The "${ activeRole.role }" prop is deprecated and will be removed in a future version. ` +
      `Please use role="${ activeRole.role }" instead.`
    );

    return activeRole.className;
  } else {
    const roleConfig = buttonRoles.find(({ role }) => role === props.role);

    return roleConfig?.className || 'role-primary';
  }
});

const activeSizeClassName = computed(() => {
  const activeSize = buttonSizes.find(({ size }) => props[size]);

  if (activeSize) {
    console.warn(
      `[RcButton] The "${ activeSize.size }" prop is deprecated and will be removed in a future version. ` +
      `Please use size="${ activeSize.size }" instead.`
    );

    return activeSize.className;
  } else {
    const sizeConfig = buttonSizesNew.find(({ size }) => size === props.size);

    return sizeConfig?.className || '';
  }
});

const buttonClass = computed(() => {
  return {
    btn:                         true,
    [activeRoleClassName.value]: true,
    [activeSizeClassName.value]: !!activeSizeClassName.value,
  };
});

const RcFocusTarget = ref<HTMLElement | null>(null);

const focus = () => {
  RcFocusTarget?.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <button
    ref="RcFocusTarget"
    role="button"
    :class="{ ...buttonClass }"
  >
    <slot name="before">
      <!-- Empty Content -->
    </slot>
    <slot>
      <!-- Empty Content -->
    </slot>
    <slot name="after">
      <!-- Empty Content -->
    </slot>
  </button>
</template>

<style lang="scss" scoped>
button {
  &.role-link {
    &:focus, &.focused {
      @include focus-outline;
      outline-offset: -2px;
    }

    &:hover {
      background-color: var(--accent-btn);
      box-shadow: none;
    }
  }

  &.role-ghost {
    padding: 0;
    background-color: transparent;

    &:focus, &.focused {
      @include focus-outline;
      outline-offset: 0;
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 0;
    }
  }
}</style>
