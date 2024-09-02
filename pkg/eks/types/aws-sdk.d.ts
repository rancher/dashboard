// data from aws-sdk/client-ec2
// aws-sdk/client-iam
// aws-sdk/client-eks

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

// iam describeRoles
export interface IamRole {
  AssumeRolePolicyDocument: string,
  RoleId: string,
  RoleName: string,
  Arn: string
}

// list of all launch templates from eks describeLaunchTemplates
export interface LaunchTemplate {
  LaunchTemplateId?: string,
  Versions?: string[],
  LaunchTemplateName: string,
  LatestVersionNumber?: string,
  DefaultVersionNumber?: string,
}

export interface TagSpecification {
  Tags?: {
    Key: string,
    Value: string
  }[],
  ResourceType?: string
}

export interface BlockDeviceMapping {
  Ebs: {
    VolumeSize: string
  }
}

export interface LaunchTemplateVersionData {
  BlockDeviceMappings: BlockDeviceMapping[],
  ImageId:string,
  InstanceType:string,
  TagSpecifications: TagSpecification[],
  UserData: string
}
export interface LaunchTemplateVersion {
  VersionNumber: string,
  LaunchTemplateName: string,
  LaunchTemplateData: LaunchTemplateVersionData,
  LaunchTemplateId: string,
  DefaultVersion: boolean
}

// information about a specific launch template returned from eks describeLaunchTemplateVersions
export interface LaunchTemplateDetail {
  LaunchTemplateVersions: LaunchTemplateVersion[]
}

// ec2 describeVpcs
export interface VPC {
  VpcId: string,
  Tags: {
    Key: string,
    Value: string
  }[]
}

// ec2 describeSubnets
export interface Subnet {
  VpcId: string,
  SubnetId: string,
  Tags: {
    Key: string,
    Value: string
  }[]
}

// kms listKeys
export interface KmsKey {
   KeyArn: string
}

// eks describeAddonVersions
export interface EKSAddon {
  addonVersions: {
    compatibilities: {
      clusterVersion: string
    }[]
}[]
}

export interface EC2Region {
  RegionName: string
}

// ec2 describeSecurityGroups
export interface SecurityGroup {
  GroupId: string,
  GroupName: string,
  VpcId: string
}
