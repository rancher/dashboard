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
.role-link {
   &:focus, &.focused {
    outline: var(--outline-width) solid var(--border);
    box-shadow: 0 0 0 var(--outline-width) var(--outline);
   }
}

button {
  &.role-ghost {
    padding: 0;

    &:focus, &.focused {
      outline: 2px solid var(--primary-keyboard-focus);
      outline-offset: 0;
    }

    &:focus-visible {
      outline: 2px solid var(--primary-keyboard-focus);
      outline-offset: 0;
    }
  }
}</style>
