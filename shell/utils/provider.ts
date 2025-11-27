import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';

export function getHostedProviders(context: ClusterProvisionerContext) {
  return context?.$extension?.getProviders(context)?.filter((p: IClusterProvisioner) => p.group === 'hosted') || [];
}

export function isHostedProvider(context: ClusterProvisionerContext, provisioner: string) {
  if (!provisioner) {
    return false;
  }
  const provisioners = new Set(getHostedProviders(context).map((p: IClusterProvisioner) => p.id.toLowerCase()));

  return provisioners.has(provisioner.toLowerCase());
}
