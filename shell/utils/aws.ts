import { Subnet, VPC } from '@shell/types/aws-sdk';

export function isIpv4Network(network: Subnet | VPC): boolean {
  return !!network.CidrBlock;
}

export function isIpv6Network(network: Subnet | VPC): boolean {
  return !!network.Ipv6CidrBlockAssociationSet?.length;
}

export function getVpcDisplayName(vpc: VPC): string {
  const nameTag = vpc.Tags?.find((t) => t.Key === 'Name');

  return nameTag ? `${ nameTag.Value } (${ vpc.VpcId })` : vpc.VpcId;
}

export function getSubnetDisplayName(subnet: Subnet): string {
  const nameTag = subnet.Tags?.find((t) => t.Key === 'Name');

  return nameTag ? `${ nameTag.Value } (${ subnet.SubnetId })` : subnet.SubnetId;
}
