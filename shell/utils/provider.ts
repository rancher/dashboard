import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';

export function getHostedProviders(context: ClusterProvisionerContext) {
  return context?.$extension?.getProviders(context)?.filter((p: IClusterProvisioner) => p.group === 'hosted') || [];
}

export function getCAPIProviders(context: ClusterProvisionerContext) {
  return context?.$extension?.getProviders(context)?.filter((p: IClusterProvisioner) => p.group === 'capi') || [];
}

export function isHostedProvider(context: ClusterProvisionerContext, provisioner: string) {
  if (!provisioner) {
    return false;
  }
  const provisioners = new Set(getHostedProviders(context).map((p: IClusterProvisioner) => p.id.toLowerCase()));

  return provisioners.has(provisioner.toLowerCase());
}
export function isCAPIProvider(context: ClusterProvisionerContext, provisioner: string) {
  if (!provisioner) {
    return false;
  }
  const provisioners = new Set(getCAPIProviders(context).map((p: IClusterProvisioner) => p.id.toLowerCase()));

  return provisioners.has(provisioner.toLowerCase());
}
