// TODO: 13211 Investigate why `InstanceType<typeof RcButton>` fails prod builds
// export type RcButtonType = InstanceType<typeof RcButton>
export type RcButtonType = {
  focus: () => void;
}

export type ButtonRole = 'primary' | 'secondary' | 'tertiary' | 'link' | 'multiAction' | 'ghost';

export type ButtonRoleNewProps = {
  role: ButtonRole;
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

export type ButtonSizeProps = {
  small?: boolean;
}
