<script setup lang="ts">
/**
 * A button element used for performing actions, such as submitting forms or
 * opening dialogs.
 *
 * Example:
 *
 * <rc-button variant="primary" @click="doAction">Perform an Action</rc-button>
 */
import { computed, ref } from 'vue';
import {
  ButtonVariantProps, ButtonSizeProps, ButtonVariantNewProps, ButtonSizeNewProps, ButtonSize,
  IconProps
} from './types';
import RcIcon from '@components/RcIcon/RcIcon.vue';

const buttonVariants: { variant: keyof ButtonVariantProps, className: string }[] = [
  { variant: 'primary', className: 'variant-primary' },
  { variant: 'secondary', className: 'variant-secondary' },
  { variant: 'tertiary', className: 'variant-tertiary' },
  { variant: 'link', className: 'variant-link' },
  { variant: 'multiAction', className: 'variant-multi-action' },
  { variant: 'ghost', className: 'variant-ghost' },
];

const buttonSizes: { size: keyof ButtonSizeProps, className: string }[] = [
  { size: 'small', className: 'btn-sm' },
];

const buttonSizesNew: { size: ButtonSize, className: string }[] = [
  { size: 'small', className: 'btn-small' },
  { size: 'medium', className: 'btn-medium' },
  { size: 'large', className: 'btn-large' },
];

const props = withDefaults(defineProps<ButtonVariantProps & ButtonSizeProps & ButtonVariantNewProps & ButtonSizeNewProps & IconProps>(), { size: 'medium' });

const activeVariantClassName = computed(() => {
  if (props.variant === 'multiAction' || props.multiAction) {
    console.warn('[RcButton] The "multiAction" variant is deprecated and will be removed in a future version.'); // eslint-disable-line no-console
  }

  const activeVariant = buttonVariants.find(({ variant }) => props[variant]);

  if (activeVariant) {
    console.warn( // eslint-disable-line no-console
      `[RcButton] The "${ activeVariant.variant }" prop is deprecated and will be removed in a future version. ` +
      `Please use variant="${ activeVariant.variant }" instead.`
    );

    return activeVariant.className;
  } else {
    const variantConfig = buttonVariants.find(({ variant }) => variant === props.variant);

    return variantConfig?.className || 'variant-primary';
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
    'rc-button':                    true,
    btn:                            true,
    [activeVariantClassName.value]: true,
    [activeSizeClassName.value]:    !!activeSizeClassName.value,
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
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  // Much of the styling in here came from _button.scss. Because we're making changes from role to variant and we don't want to impact existing use cases we're pulling in some of these styles. We should in the long run deprecate that file.
  // Variant styles
  &.variant-primary {
    background: var(--primary);
    color: var(--primary-text);

    &:hover, &._hover {
      background-color: var(--primary-hover-bg);
      color: var(--primary-text);
    }

    &:focus, &.focused {
      background-color: var(--primary-hover-bg);
      color: var(--primary-text);
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }

    &:disabled {
      background: var(--primary);
      color: var(--primary-text);
      opacity: 0.5;
    }
  }

  &.variant-secondary {
    background: var(--secondary, transparent);
    color: var(--on-secondary, var(--primary));
    border: solid 1px var(--secondary-border, var(--primary));

    &:hover, &._hover {
      background: var(--secondary-hover, transparent);
      color: var(--on-secondary, var(--lightest));
    }

    &:focus, &.focused {
      background-color: var(--secondary-hover, var(--primary-hover-bg));
      color: var(--on-secondary, var(--primary-text));
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }

  &.variant-tertiary {
    background: var(--tertiary, var(--accent-btn));
    color: var(--on-tertiary, var(--primary));
    border: solid 1px var(--tertiary-border, var(--primary));

    &:hover {
      background: var(--tertiary-hover, var(--accent-btn));
      color: var(--on-tertiary-hover, var(--lightest));
    }

    &:focus, &.focused {
      background-color: var(--tertiary-hover, var(--primary-hover-bg));
      color: var(--on-tertiary, var(--primary-text));
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }

  &.variant-link {
    background: transparent;
    color: var(--link);

    &:hover, &._hover {
      color: var(--lightest);
      background-color: var(--accent-btn);
      box-shadow: none;
    }

    &:focus, &.focused {
      @include focus-outline;
      outline-offset: -2px;
      background: transparent;
      color: var(--link);
      box-shadow: none;
    }

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }

  &.variant-multi-action {
    background: var(--accent-btn);
    border: solid thin var(--primary);
    color: var(--primary);
    border-radius: 2px;
  }

  &.variant-ghost {
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

  // Size styles
  &.btn-small {
    //:not(.btn-sm) is being used to make the style more specific to override global styles. We may want to get rid of those styles at some point.
    &, &:not(.btn-sm) {
      line-height: 15px;
      font-size: 12px;
      min-height: 24px;

      padding: 0 8px;
      gap: 8px;
    }
  }

  &.btn-medium {
    //:not(.btn-sm) is being used to make the style more specific to override global styles. We may want to get rid of those styles at some point.
    &, &:not(.btn-sm) {
      line-height: 18px;
      font-size: 14px;
      min-height: 32px;

      padding: 0 12px;
      gap: 8px;
    }
  }

  &.btn-large {
    // This is the default size brought by the global button styling
    &, &:not(.btn-sm) {
      line-height: 20px;
      font-size: 16px;
      min-height: 40px;

      padding: 0 16px;
      gap: 12px;
    }
  }
}</style>
