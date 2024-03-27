// data from aws-sdk/client-ec2

export interface InstanceType {
  apiName: string,
  label: string,
  groupLabel: string,
  supportedUsageClasses: string[]
}

export interface InstanceTypeOption {
  label: string,
  value?: string,
  group?: string,
  kind?: string
}

export interface IamRole {
  AssumeRolePolicyDocument: string,
  RoleId: string,
  RoleName: string
}
