import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import { _EDIT } from '@shell/config/query-params';
import { resolveSubType } from '@shell/edit/provisioning.cattle.io.cluster/subtype-detection';

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

/**
 * The provisioner from an extension that handles an existing cluster, as the cluster's edit page finds it, see `resolveSubType`
 *
 * @param context passed to each provisioner
 * @param cluster the cluster (`provisioning.cattle.io.cluster`)
 * @returns the provisioner, or undefined where no extension handles the cluster
 */
export function getClusterProvisioner(context: ClusterProvisionerContext, cluster: any): IClusterProvisioner | undefined {
  const provisioners: IClusterProvisioner[] = context?.$extension?.getProviders?.(context) || [];
  const subType = resolveSubType({
    query: {}, value: cluster, extensions: provisioners, realMode: _EDIT
  });

  return subType ? provisioners.find((p) => p.id === subType) : undefined;
}
