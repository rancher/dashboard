import { RcIconType } from '@components/RcIcon/types';

// TODO: 13211 Investigate why `InstanceType<typeof RcButton>` fails prod builds
// export type RcButtonType = InstanceType<typeof RcButton>
export type RcButtonType = {
  focus: () => void;
}

export type ButtonRole = 'primary' | 'secondary' | 'tertiary' | 'link' | 'multiAction' | 'ghost';

export type ButtonRoleNewProps = {
  role?: ButtonRole;
}

/**
 * @deprecated Use the `role` property instead. These boolean props will be removed in a future version.
 */
export type ButtonRoleProps = {
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
  leftIcon?: keyof typeof RcIconType;
  rightIcon?: keyof typeof RcIconType;
}
