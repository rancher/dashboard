<script setup lang="ts">
import { computed, ref, defineExpose } from 'vue';

export type RcButtonType = {
  focus: () => void;
}

type Props = {
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  link?: boolean;
}

const buttonRoles = [
  { role: 'primary', className: 'role-primary' },
  { role: 'secondary', className: 'role-secondary' },
  { role: 'tertiary', className: 'role-tertiary' },
  { role: 'link', className: 'role-link' },
];

const props = defineProps<Props>();

const buttonClass = computed(() => {
  const activeRole = buttonRoles.find(({ role }) => props[role as keyof Props]);

  return {
    btn: true,

    [activeRole?.className || 'role-primary']: true,
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
</style>
