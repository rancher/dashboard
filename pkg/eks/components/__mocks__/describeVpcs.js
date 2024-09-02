export default {
  $metadata: {
    httpStatusCode:  200,
    requestId:       '12345',
    attempts:        1,
    totalRetryDelay: 0
  },
  Vpcs: [
    {
      CidrBlock:               '192.168.0.0/16',
      DhcpOptionsId:           'dopt-1234',
      State:                   'available',
      VpcId:                   'vpc-123',
      OwnerId:                 '54321',
      InstanceTenancy:         'default',
      CidrBlockAssociationSet: [
        {
          AssociationId:  'vpc-cidr-assoc-123',
          CidrBlock:      '192.168.0.0/16',
          CidrBlockState: { State: 'associated' }
        }
      ],
      IsDefault: false,
      Tags:      [
        {
          Key:   'displayName',
          Value: 'test'
        },
        {
          Key:   'Name',
          Value: 'test-eks-vpc-VPC'
        }
      ]
    },
    {
      CidrBlock:               '172.31.0.0/16',
      DhcpOptionsId:           'dopt-12345',
      State:                   'available',
      VpcId:                   'vpc-1234',
      OwnerId:                 '54321',
      InstanceTenancy:         'default',
      CidrBlockAssociationSet: [
        {
          AssociationId:  'vpc-cidr-assoc-12345',
          CidrBlock:      '172.31.0.0/16',
          CidrBlockState: { State: 'associated' }
        }
      ],
      IsDefault: false,
      Tags:      [
        {
          Key:   'Name',
          Value: 'aws-controltower-VPC'
        }
      ]
    },
    {
      CidrBlock:               '192.168.0.0/16',
      DhcpOptionsId:           'dopt-123456',
      State:                   'available',
      VpcId:                   'vpc-12345',
      OwnerId:                 '54321',
      InstanceTenancy:         'default',
      CidrBlockAssociationSet: [
        {
          AssociationId:  'vpc-cidr-assoc-123456',
          CidrBlock:      '192.168.0.0/16',
          CidrBlockState: { State: 'associated' }
        }
      ],
      IsDefault: false,
      Tags:      [

        {
          Key:   'Name',
          Value: 'mo-eks-eks-vpc-VPC'
        },
        {
          Key:   'displayName',
          Value: 'mo-eks'
        }
      ]
    }
  ]
};
