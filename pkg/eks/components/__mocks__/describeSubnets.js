export default {
  $metadata: {
    httpStatusCode:  200,
    requestId:       '123456',
    attempts:        1,
    totalRetryDelay: 0
  },
  Subnets: [
    {
      AvailabilityZone:            'us-west-2b',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     4091,
      CidrBlock:                   '172.31.32.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         false,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-1234',
      VpcId:                       'vpc-1234',
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
      AvailabilityZone:            'us-west-2c',
      AvailabilityZoneId:          'usw2-az3',
      AvailableIpAddressCount:     4091,
      CidrBlock:                   '172.31.80.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         false,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-321',
      VpcId:                       'vpc-1234',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
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
      AvailabilityZoneId:          'usw2-az2',
      AvailableIpAddressCount:     16379,
      CidrBlock:                   '192.168.64.0/18',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-4321',
      VpcId:                       'vpc-12345',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
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
      AvailabilityZone:            'us-west-2b',
      AvailabilityZoneId:          'usw2-az1',
      AvailableIpAddressCount:     16379,
      CidrBlock:                   '192.168.128.0/18',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-21',
      VpcId:                       'vpc-12345',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
      Tags:                        [
        {
          Key:   'aws:cloudformation:logical-id',
          Value: 'Subnet02'
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
          Key:   'kubernetes.io/role/elb',
          Value: '1'
        },
        {
          Key:   'Name',
          Value: 'test-eks-vpc-Subnet02'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-21'
    },
    {
      AvailabilityZone:            'us-west-2c',
      AvailabilityZoneId:          'usw2-az3',
      AvailableIpAddressCount:     16379,
      CidrBlock:                   '192.168.192.0/18',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         true,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-123',
      VpcId:                       'vpc-12345',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
      Tags:                        [

        {
          Key:   'aws:cloudformation:stack-name',
          Value: 'test-eks-vpc'
        },
        {
          Key:   'displayName',
          Value: 'test'
        },
        {
          Key:   'kubernetes.io/role/elb',
          Value: '1'
        },
        {
          Key:   'Name',
          Value: 'test-eks-vpc-Subnet03'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-123'
    },
    {
      AvailabilityZone:            'us-west-2a',
      AvailabilityZoneId:          'usw2-az2',
      AvailableIpAddressCount:     4091,
      CidrBlock:                   '172.31.64.0/20',
      DefaultForAz:                false,
      MapPublicIpOnLaunch:         false,
      MapCustomerOwnedIpOnLaunch:  false,
      State:                       'available',
      SubnetId:                    'subnet-12',
      VpcId:                       'vpc-12',
      OwnerId:                     '1234',
      AssignIpv6AddressOnCreation: false,
      Ipv6CidrBlockAssociationSet: [],
      Tags:                        [
        {
          Key:   'Name',
          Value: 'aws-controltower-PrivateSubnet1A'
        },

        {
          Key:   'Network',
          Value: 'Private'
        }
      ],
      SubnetArn: 'arn:aws:ec2:us-west-2:821532311898:subnet/subnet-12'
    }
  ]
};
