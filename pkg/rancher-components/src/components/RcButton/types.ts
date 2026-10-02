import type { RouteLocationRaw } from 'vue-router';
import { RcIconType } from '@components/RcIcon/types';

export type NavigationProps = { to?: RouteLocationRaw; href?: string }

// TODO: 13211 Investigate why `InstanceType<typeof RcButton>` fails prod builds
// export type RcButtonType = InstanceType<typeof RcButton>
export type RcButtonType = {
  focus: () => void;
}

export type ButtonVariant = 'solid' | 'outline' | 'tertiary' | 'link' | 'multiAction' | 'ghost';

/**
 * @deprecated Describe the button with `variant` and `color` instead: `primary` is
 * `variant="solid"` and `secondary` is `variant="outline"`, both with `color="primary"`.
 */
export type DeprecatedButtonVariant = 'primary' | 'secondary';

export type ButtonColor = 'primary' | 'destructive';

export type ButtonVariantNewProps = {
  variant?: ButtonVariant | DeprecatedButtonVariant;
}

export type ButtonColorProps = {
  color?: ButtonColor;
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

export type ButtonSizeNewProps = {
  size?: ButtonSize;
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
