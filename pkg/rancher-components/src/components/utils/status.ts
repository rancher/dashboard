import { computed, Ref } from 'vue';

export const StatusDefinitions = {
  info: {
    primary:   '--rc-info',
    secondary: '--rc-info-secondary'
  },
  success: {
    primary:   '--rc-success',
    secondary: '--rc-success-secondary'
  },
  warning: {
    primary:   '--rc-warning',
    secondary: '--rc-warning-secondary'
  },
  error: {
    primary:   '--rc-error',
    secondary: '--rc-error-secondary'
  },
  unknown: {
    primary:   '--rc-unknown',
    secondary: '--rc-unknown-secondary'
  },
  none: {
    primary:   '--rc-none',
    secondary: '--rc-none-secondary'
  },
};

export type Status = keyof typeof StatusDefinitions;
export type Style = 'solid' | 'outlined';

export function wrapIfVar(colorVar: string) {
  return colorVar.startsWith('--') ? `var(${ colorVar })` : colorVar;
}

/**
 * A composable to make it easier to use status colors in multiple components
 *
 * @param status A Ref containing the status value
 * @param style {@link Style} Will the block of code being using the solid or outlined styling
 * @returns An object containing the relevant style colors
 */
export function useStatusColors(status: Ref<Status>, style: Style) {
  const statusColors = computed(() => {
    return StatusDefinitions[status.value];
  });
  const isOutlined = style === 'outlined';

  const borderColor = computed(() => {
    const colorVar = isOutlined ? statusColors.value.secondary : statusColors.value.primary;

    return wrapIfVar(colorVar);
  });

  const backgroundColor = computed(() => {
    if (status.value === 'none') {
      return 'none';
    }
    const colorVar = isOutlined ? statusColors.value.secondary : statusColors.value.primary;

    return wrapIfVar(colorVar);
  });

  const textColor = computed(() => {
    const colorVar = isOutlined ? statusColors.value.primary : statusColors.value.secondary;

    return wrapIfVar(colorVar);
  });

  return {
    borderColor,
    backgroundColor,
    textColor
  };
}
