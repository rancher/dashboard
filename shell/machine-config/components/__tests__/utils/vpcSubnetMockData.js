export const vpcInfo = {
  $metadata: {
    httpStatusCode:  200,
    requestId:       '12345',
    attempts:        1,
    totalRetryDelay: 0
  },
  Vpcs: [
    {
      CidrBlock:                   '192.168.0.0/16',
      DhcpOptionsId:               'dopt-1234',
      State:                       'available',
      VpcId:                       'vpc-123',
      Ipv6CidrBlockAssociationSet: ['1234'],
      OwnerId:                     '54321',
      InstanceTenancy:             'default',
      CidrBlockAssociationSet:     [
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
      CidrBlock:                   '172.31.0.0/16',
      DhcpOptionsId:               'dopt-12345',
      State:                       'available',
      VpcId:                       'vpc-1234',
      OwnerId:                     '54321',
      InstanceTenancy:             'default',
      Ipv6CidrBlockAssociationSet: ['12345'],
      CidrBlockAssociationSet:     [
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

export const subnetInfo = {
  $metadata: {
    httpStatusCode:  200,
    requestId:       '123456',
    attempts:        1,
    totalRetryDelay: 0
  },
  Subnets: [
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     4091,
      CidrBlock:                   '172.31.32.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         false,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-1234',
      VpcId:                       'vpc-123',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
      Tags:                        [
        {
          Key:   'Name',
          Value: 'aws-controltower-PrivateSubnet2A'
        },

        {
          Key:   'Network',
          Value: 'Private'
        },

        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'PrivateSubnet2A'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-1234'
    },
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     4091,
      CidrBlock:                   '172.31.80.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         false,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-321',
      VpcId:                       'vpc-123',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: ['1234'],
      Tags:                        [
        {
          Key:   'Name',
          Value: 'aws-controltower-PrivateSubnet3A'
        },
        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'PrivateSubnet3A'
        },
        {
          Key:   'Network',
          Value: 'Private'
        },
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-321'
    },
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     16379,
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-4321',
      VpcId:                       'vpc-1234',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: ['12345'],
      Tags:                        [
        {
          Key:   'Name',
          Value: 'test-eks-vpc-Subnet01'
        },
        {
          Key:   'displayName',
          Value: 'test'
        },
        {
          Key:   'aws:cloudformation:stack-name',
          Value: 'test-eks-vpc'
        },
        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'Subnet01'
        },
        {
          Key:   'kubernetes.io/role/elb',
          Value: '1'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-4321'
    },
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     16379,
      CidrBlock:                   '172.31.80.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-9876',
      VpcId:                       'vpc-12345',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Tags:                        [
        {
          Key:   'Name',
          Value: 'test-eks-vpc-Subnet01'
        },
        {
          Key:   'displayName',
          Value: 'test'
        },
        {
          Key:   'aws:cloudformation:stack-name',
          Value: 'test-eks-vpc'
        },
        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'Subnet01'
        },
        {
          Key:   'kubernetes.io/role/elb',
          Value: '1'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-4321'
    },
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     16379,
      CidrBlock:                   '172.31.80.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-5432',
      VpcId:                       'vpc-12345',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Tags:                        [
        {
          Key:   'Name',
          Value: 'test-eks-vpc-Subnet01'
        },
        {
          Key:   'displayName',
          Value: 'test'
        },
        {
          Key:   'aws:cloudformation:stack-name',
          Value: 'test-eks-vpc'
        },
        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'Subnet01'
        },
        {
          Key:   'kubernetes.io/role/elb',
          Value: '1'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-4321'
    },
  ]
};
