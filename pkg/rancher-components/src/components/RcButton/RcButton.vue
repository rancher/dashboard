<script setup lang="ts">
/**
 * A button element used for performing actions, such as submitting forms or
 * opening dialogs.
 *
 * Example:
 *
 * <rc-button primary @click="doAction">Perform an Action</rc-button>
 */
import { computed, ref, defineExpose } from 'vue';
import { ButtonRoleProps, ButtonSizeProps } from './types';

const buttonRoles: { role: keyof ButtonRoleProps, className: string }[] = [
  { role: 'primary', className: 'role-primary' },
  { role: 'secondary', className: 'role-secondary' },
  { role: 'tertiary', className: 'role-tertiary' },
  { role: 'link', className: 'role-link' },
  { role: 'ghost', className: 'role-ghost' },
];

const buttonSizes: { size: keyof ButtonSizeProps, className: string }[] = [
  { size: 'small', className: 'btn-sm' },
];

const props = defineProps<ButtonRoleProps & ButtonSizeProps>();

const buttonClass = computed(() => {
  const activeRole = buttonRoles.find(({ role }) => props[role]);
  const isButtonSmall = buttonSizes.some(({ size }) => props[size]);

  return {
    btn: true,

    [activeRole?.className || 'role-primary']: true,

    'btn-sm': isButtonSmall,
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
    :class="{ ...buttonClass, ...($attrs.class || { }) }"
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
