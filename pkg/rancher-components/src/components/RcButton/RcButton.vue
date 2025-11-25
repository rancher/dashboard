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
  ButtonRoleProps, ButtonSizeProps, ButtonRoleNewProps, ButtonSizeNewProps, ButtonSize,
  IconProps
} from './types';
import RcIcon from '@components/RcIcon/RcIcon.vue';

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

const props = withDefaults(defineProps<ButtonRoleProps & ButtonSizeProps & ButtonRoleNewProps & ButtonSizeNewProps & IconProps>(), { size: 'medium' });

const activeRoleClassName = computed(() => {
  const activeRole = buttonRoles.find(({ role }) => props[role]);

  if (activeRole) {
    /* eslint-disable no-console */
    console.warn(
      `[RcButton] The "${ activeRole.role }" prop is deprecated and will be removed in a future version. ` +
      `Please use role="${ activeRole.role }" instead.`
    );
    /* eslint-enable no-console */

    return activeRole.className;
  } else {
    const roleConfig = buttonRoles.find(({ role }) => role === props.role);

    return roleConfig?.className || 'role-primary';
  }
});

const activeSizeClassName = computed(() => {
  const activeSize = buttonSizes.find(({ size }) => props[size]);

  if (activeSize) {
    /* eslint-disable no-console */
    console.warn(
      `[RcButton] The "${ activeSize.size }" prop is deprecated and will be removed in a future version. ` +
      `Please use size="${ activeSize.size }" instead.`
    );
    /* eslint-enable no-console */

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
    <slot
      v-if="$slots.before || props.leftIcon"
      name="before"
    >
      <RcIcon
        v-if="props.leftIcon"
        class="left-icon"
        :type="props.leftIcon"
        size="inherit"
      />
    </slot>
    <slot>
      <!-- Empty Content -->
    </slot>
    <slot
      v-if="$slots.after || props.rightIcon"
      name="after"
    >
      <RcIcon
        v-if="props.rightIcon"
        class="right-icon"
        :type="props.rightIcon"
        size="inherit"
      />
    </slot>
  </button>
</template>

<style lang="scss" scoped>
@mixin iconMargins($size) {
  .left-icon {
    margin-right: $size;
  }

  .right-icon {
    margin-left: $size;
  }
}

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

  &.btn.btn-small {
    //:not(.btn-sm) is being used to make the style more specific to override global styles. We may want to get rid of those styles at some point.
    &, &:not(.btn-sm) {
      line-height: 15px;
      font-size: 12px;
      min-height: 24px;

      padding: 0 8px;

      @include iconMargins(8px);
    }
  }

  &.btn.btn-medium {
    //:not(.btn-sm) is being used to make the style more specific to override global styles. We may want to get rid of those styles at some point.
    &, &:not(.btn-sm) {
      line-height: 18px;
      font-size: 14px;
      min-height: 32px;

      padding: 0 12px;

      @include iconMargins(8px);
    }
  }

  &.btn.btn-large {
    // This is the default size brought by the global button styling
    &, &:not(.btn-sm) {
      line-height: 20px;
      font-size: 16px;
      min-height: 40px;

      padding: 0 16px;

      @include iconMargins(12px);
    }
  }
}</style>
