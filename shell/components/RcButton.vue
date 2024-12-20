<script setup lang="ts">
import { computed } from 'vue';

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
</script>

<template>
  <button
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
