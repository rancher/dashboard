import { RcButton } from "@components/RcButton";

export type RcButtonType = InstanceType<typeof RcButton>

export type ButtonRoleProps = {
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  link?: boolean;
}

export type ButtonSizeProps = {
  small?: boolean;
}
