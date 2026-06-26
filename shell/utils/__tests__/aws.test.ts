import { isIpv4Network, isIpv6Network, getVpcDisplayName, getSubnetDisplayName } from '@shell/utils/aws';

describe('aws utils', () => {
  describe('isIpv4Network', () => {
    it.each([
      {
        desc:     'returns true when CidrBlock is set',
        network:  { CidrBlock: '10.0.0.0/16' },
        expected: true,
      },
      {
        desc:     'returns false when CidrBlock is absent',
        network:  {},
        expected: false,
      },
      {
        desc:     'returns false when CidrBlock is an empty string',
        network:  { CidrBlock: '' },
        expected: false,
      },
      {
        desc:     'returns true when CidrBlock is a non-empty string',
        network:  { CidrBlock: '0.0.0.0/0' },
        expected: true,
      },
    ])('$desc', ({ network, expected }) => {
      expect(isIpv4Network(network as any)).toStrictEqual(expected);
    });
  });

  describe('isIpv6Network', () => {
    it.each([
      {
        desc:     'returns true when Ipv6CidrBlockAssociationSet has entries',
        network:  { Ipv6CidrBlockAssociationSet: [{ Ipv6CidrBlock: '::/0' }] },
        expected: true,
      },
      {
        desc:     'returns false when Ipv6CidrBlockAssociationSet is an empty array',
        network:  { Ipv6CidrBlockAssociationSet: [] },
        expected: false,
      },
      {
        desc:     'returns false when Ipv6CidrBlockAssociationSet is absent',
        network:  {},
        expected: false,
      },
      {
        desc:     'returns false when Ipv6CidrBlockAssociationSet is undefined',
        network:  { Ipv6CidrBlockAssociationSet: undefined },
        expected: false,
      },
    ])('$desc', ({ network, expected }) => {
      expect(isIpv6Network(network as any)).toStrictEqual(expected);
    });
  });

  describe('getVpcDisplayName', () => {
    it.each([
      {
        desc: 'returns "Name (VpcId)" when Name tag is present',
        vpc:  {
          VpcId: 'vpc-abc123',
          Tags:  [{ Key: 'Name', Value: 'my-vpc' }],
        },
        expected: 'my-vpc (vpc-abc123)',
      },
      {
        desc: 'returns VpcId alone when Tags array is empty',
        vpc:  {
          VpcId: 'vpc-abc123',
          Tags:  [],
        },
        expected: 'vpc-abc123',
      },
      {
        desc:     'returns VpcId alone when Tags is absent',
        vpc:      { VpcId: 'vpc-abc123' },
        expected: 'vpc-abc123',
      },
      {
        desc: 'returns VpcId alone when no tag has Key "Name"',
        vpc:  {
          VpcId: 'vpc-abc123',
          Tags:  [{ Key: 'Env', Value: 'prod' }],
        },
        expected: 'vpc-abc123',
      },
      {
        desc: 'uses the first Name tag when multiple tags exist',
        vpc:  {
          VpcId: 'vpc-abc123',
          Tags:  [
            { Key: 'Env', Value: 'prod' },
            { Key: 'Name', Value: 'primary-vpc' },
          ],
        },
        expected: 'primary-vpc (vpc-abc123)',
      },
    ])('$desc', ({ vpc, expected }) => {
      expect(getVpcDisplayName(vpc as any)).toStrictEqual(expected);
    });
  });

  describe('getSubnetDisplayName', () => {
    it.each([
      {
        desc:   'returns "Name (SubnetId)" when Name tag is present',
        subnet: {
          SubnetId: 'subnet-xyz789',
          Tags:     [{ Key: 'Name', Value: 'my-subnet' }],
        },
        expected: 'my-subnet (subnet-xyz789)',
      },
      {
        desc:   'returns SubnetId alone when Tags array is empty',
        subnet: {
          SubnetId: 'subnet-xyz789',
          Tags:     [],
        },
        expected: 'subnet-xyz789',
      },
      {
        desc:     'returns SubnetId alone when Tags is absent',
        subnet:   { SubnetId: 'subnet-xyz789' },
        expected: 'subnet-xyz789',
      },
      {
        desc:   'returns SubnetId alone when no tag has Key "Name"',
        subnet: {
          SubnetId: 'subnet-xyz789',
          Tags:     [{ Key: 'Zone', Value: 'us-east-1a' }],
        },
        expected: 'subnet-xyz789',
      },
    ])('$desc', ({ subnet, expected }) => {
      expect(getSubnetDisplayName(subnet as any)).toStrictEqual(expected);
    });
  });
});
