
export default {
  $metadata: {
    httpStatusCode:  200,
    requestId:       'testdata1234',
    attempts:        1,
    totalRetryDelay: 0
  },
  Roles: [
    {
      Path:                     '/',
      RoleName:                 'aws-controltower-AdministratorExecutionRole',
      RoleId:                   'testdata12340',
      Arn:                      'arn:aws:iam::testarn1234-AdministratorExecutionRole',
      CreateDate:               '2022-10-18T14:43:06.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22ec2.amazonaws.com%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              '',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'aws-controltower-ConfigRecorderRole',
      RoleId:                   'testdata12341',
      Arn:                      'arn:aws:iam::testarn1234-ConfigRecorderRole',
      CreateDate:               '2022-10-18T14:43:05.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22ec2.amazonaws.com%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              '',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'aws-controltower-ForwardSnsNotificationRole',
      RoleId:                   'testdata12342',
      Arn:                      'arn:aws:iam::testarn1234-ForwardSnsNotificationRole',
      CreateDate:               '2022-10-18T14:43:04.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22ec2.amazonaws.com%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              '',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'aws-controltower-ReadOnlyExecutionRole',
      RoleId:                   'testdata12343',
      Arn:                      'arn:aws:iam::testarn1234-ReadOnlyExecutionRole',
      CreateDate:               '2022-10-18T14:43:06.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              '',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'AWSAFTExecution',
      RoleId:                   'testdata12344',
      Arn:                      'arn:aws:iam::testarn1234AWSAFTExecution',
      CreateDate:               '2022-10-18T15:00:06.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Role for use with Account Factory for Terraform',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'AWSAFTService',
      RoleId:                   'testdata12345',
      Arn:                      'arn:aws:iam::testarn1234AWSAFTService',
      CreateDate:               '2022-10-18T14:59:56.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Role for use with Account Factory for Terraform',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'AWSControlTowerExecution',
      RoleId:                   'testdata12346',
      Arn:                      'arn:aws:iam::testarn1234AWSControlTowerExecution',
      CreateDate:               '2022-10-18T14:39:52.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A764870144532%3Aroot%22%7D%2C%22Action%22%3A%22sts%3AAssumeRole%22%7D%5D%7D',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/',
      RoleName:                 'AWSControlTower_VPCFlowLogsRole',
      RoleId:                   'testdata12347',
      Arn:                      'arn:aws:iam::testarn1234AWSControlTower_VPCFlowLogsRole',
      CreateDate:               '2022-10-18T14:51:47.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/aws-reserved/sso.amazonaws.com/eu-central-1/',
      RoleName:                 'AWSReservedSSO_AWSAdministratorAccess_edc30d7bf8e7ba96',
      RoleId:                   'testdata12348',
      Arn:                      'arn:aws:iam::testarn1234AWSReservedSSO_AWSAdministratorAccess_edc30d7bf8e7ba96',
      CreateDate:               '2022-10-18T14:41:38.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Provides full access to AWS services and resources',
      MaxSessionDuration:       43200
    },
    {
      Path:                     '/aws-reserved/sso.amazonaws.com/eu-central-1/',
      RoleName:                 'AWSReservedSSO_AWSOrganizationsFullAccess_9a83cf89abc20948',
      RoleId:                   'testdata12349',
      Arn:                      'arn:aws:iam::testarn1234AWSReservedSSO_AWSOrganizationsFullAccess_9a83cf89abc20948',
      CreateDate:               '2022-10-18T14:41:34.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22arn%3Aaws%3Aiam%3A%3A821532311898%3Asaml-provider%2FAWSSSO_ed9c8619bca0b57b_DO_NOT_DELETE%22%7D%2C%22Action%22%3A%5B%22sts%3AAssumeRoleWithSAML%22%2C%22sts%3ATagSession%22%5D%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22SAML%3Aaud%22%3A%22https%3A%2F%2Fsignin.aws.amazon.com%2Fsaml%22%7D%7D%7D%5D%7D',
      Description:              'Provides full access to AWS Organizations',
      MaxSessionDuration:       43200
    },
    {
      Path:                     '/aws-reserved/sso.amazonaws.com/eu-central-1/',
      RoleName:                 'AWSReservedSSO_AWSPowerUserAccess_aef8a9f321e01efc',
      RoleId:                   'testdata123410',
      Arn:                      'arn:aws:iam::testarn1234AWSReservedSSO_AWSPowerUserAccess_aef8a9f321e01efc',
      CreateDate:               '2022-10-18T14:41:36.000Z',
      AssumeRolePolicyDocument: '%%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Provides full access to AWS services and resources, but does not allow management of Users and groups',
      MaxSessionDuration:       43200
    },
    {
      Path:                     '/aws-reserved/sso.amazonaws.com/eu-central-1/',
      RoleName:                 'AWSReservedSSO_AWSReadOnlyAccess_dfff1dd8772461a1',
      RoleId:                   'testdata123411',
      Arn:                      'arn:aws:iam::testarn1234AWSReservedSSO_AWSReadOnlyAccess_dfff1dd8772461a1',
      CreateDate:               '2022-10-18T14:41:37.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22eks.amazonaws%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'This policy grants permissions to view resources and basic metadata across all AWS services',
      MaxSessionDuration:       43200
    },
    {
      Path:                     '/aws-service-role/eks.amazonaws.com/',
      RoleName:                 'AWSServiceRoleForAmazonEKS',
      RoleId:                   'testdata123412',
      Arn:                      'arn:aws:iam::testarn1234AWSServiceRoleForAmazonEKS',
      CreateDate:               '2023-04-21T13:47:54.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22eks.amazonaws%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Allows Amazon EKS to call AWS services on your behalf.',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/aws-service-role/eks-nodegroup.amazonaws.com/',
      RoleName:                 'AWSServiceRoleForAmazonEKSNodegroup',
      RoleId:                   'testdata123413',
      Arn:                      'arn:aws:iam::testarn1234AWSServiceRoleForAmazonEKSNodegroup',
      CreateDate:               '2023-04-21T17:04:04.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22eks.amazonaws%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'This policy allows Amazon EKS to create and manage Nodegroups',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/aws-service-role/autoscaling.amazonaws.com/',
      RoleName:                 'AWSServiceRoleForAutoScaling',
      RoleId:                   'testdata123414',
      Arn:                      'arn:aws:iam::testarn1234AWSServiceRoleForAutoScaling',
      CreateDate:               '2023-04-21T17:04:25.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22eks.amazonaws%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Default Service-Linked Role enables access to AWS Services and Resources used or managed by Auto Scaling',
      MaxSessionDuration:       3600
    },
    {
      Path:                     '/aws-service-role/member.org.stacksets.cloudformation.amazonaws.com/',
      RoleName:                 'AWSServiceRoleForCloudFormationStackSetsOrgMember',
      RoleId:                   'testdata123415',
      Arn:                      'arn:aws:iam::testarn1234AWSServiceRoleForCloudFormationStackSetsOrgMember',
      CreateDate:               '2022-10-25T07:50:00.000Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%20%222012-10-17%22%2C%22Statement%22%3A%20%5B%7B%22Effect%22%3A%20%22Allow%22%2C%22Principal%22%3A%20%7B%22Service%22%3A%20%22eks.amazonaws%22%7D%2C%22Action%22%3A%20%22sts%3AAssumeRole%22%7D%5D%7D',
      Description:              'Service linked role for CloudFormation StackSets (Organization Member)',
      MaxSessionDuration:       3600
    }
  ],
  IsTruncated: false
};
