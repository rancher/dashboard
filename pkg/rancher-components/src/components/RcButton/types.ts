// TODO: 13211 Investigate why `InstanceType<typeof RcButton>` fails prod builds
// export type RcButtonType = InstanceType<typeof RcButton>
export type RcButtonType = {
  focus: () => void;
}

export type ButtonRoleProps = {
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  link?: boolean;
  ghost?: boolean;
}

export type ButtonSizeProps = {
  small?: boolean;
}
