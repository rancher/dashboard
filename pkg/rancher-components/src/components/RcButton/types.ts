import type { RouteLocationRaw } from 'vue-router';
import { RcIconType } from '@components/RcIcon/types';

export type NavigationProps = { to?: RouteLocationRaw; href?: string }

// TODO: 13211 Investigate why `InstanceType<typeof RcButton>` fails prod builds
// export type RcButtonType = InstanceType<typeof RcButton>
export type RcButtonType = {
  focus: () => void;
}

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link' | 'multiAction' | 'ghost';

export type ButtonVariantNewProps = {
  variant?: ButtonVariant;
}

/**
 * @deprecated Use the `variant` property instead. These boolean props will be removed in a future version.
 */
export type ButtonVariantProps = {
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  link?: boolean;
  multiAction?: boolean;
  ghost?: boolean;

}

export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * These variants can take their size from surrounding text and aren't required
 * to draw their own box.
 */
export type ButtonInheritVariant = 'ghost' | 'link';

export type ButtonSizeNewProps = {
  size?: ButtonSize | 'inherit';
}

/**
 * @deprecated Use the `size` property instead. The `small` boolean prop will be removed in a future version.
 */
export type ButtonSizeProps = {
  small?: boolean;
}

export type IconProps = {
  leftIcon?: RcIconType;
  rightIcon?: RcIconType;
}
