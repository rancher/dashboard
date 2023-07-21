<script lang="ts">
import { defineComponent, computed } from 'vue';

type Props = {
  primary: boolean;
  secondary: boolean;
  tertiary: boolean;
};

export default defineComponent({
  props: {
    primary:   Boolean,
    secondary: Boolean,
    tertiary:  Boolean,
  },
  setup(props) {
    const buttonRoles = [
      { role: 'primary', className: 'role-primary' },
      { role: 'secondary', className: 'role-secondary' },
      { role: 'tertiary', className: 'role-tertiary' },
    ];

    const buttonClass = computed(() => {
      const activeRole = buttonRoles.find(({ role }) => props[role as keyof Props]);

      return {
        btn: true,

        [activeRole?.className || 'role-primary']: true,
      };
    });

    return { props, buttonClass };
  },
});
</script>

<template>
  <button :class="{ ...buttonClass, ...$attrs.class }">
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
