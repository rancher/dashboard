
import { addParams, QueryParams } from '@shell/utils/url';
import { Store } from 'vuex';

// taken from https://learn.microsoft.com/en-us/azure/reliability/availability-zones-service-support#azure-regions-with-availability-zone-support

export const regionsWithAvailabilityZones = {
  brazilsouth:        true,
  francecentral:      true,
  qatarcentral:       true,
  southafricanorth:   true,
  australiaeast:      true,
  canadacentral:      true,
  italynorth:         true,
  uaenorth:           true,
  centralindia:       true,
  centralus:          true,
  germanywestcentral: true,
  israelcentral:      true,
  japaneast:          true,
  eastus:             true,
  norwayeast:         true,
  eastus2:            true,
  northeurope:        true,
  southeastasia:      true,
  southcentralus:     true,
  uksouth:            true,
  eastasia:           true,
  usgovvirginia:      true,
  westeurope:         true,
  chinanorth3:        true,
  westus2:            true,
  swedencentral:      true,
  koreacentral:       true,
  westus3:            true,
  switzerlandnorth:   true,
  newzealandnorth:    true,
  mexicocentral:      true,
  polandcentral:      true,
  spaincentral:       true,
} as any;

/**
 *
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param resourceLocation any valid AKS region
 * @param clusterId (optional) norman cluster id
 * @param resource AKS resource to be fetched - one of aksLocations, aksVersions, aksVMSizes, aksVirtualNetworks
 */
async function getAKSOptions(store: any, azureCredentialSecret: string, resourceLocation: string | null, resource: string, clusterId?: string) :Promise<any> {
  if (!azureCredentialSecret) {
    return null;
  }

  const params: QueryParams = { cloudCredentialId: azureCredentialSecret };

  if (!!resourceLocation) {
    params.region = resourceLocation;
  }
  if (!!clusterId) {
    params.clusterId = clusterId;
  }

  const url = addParams(`/meta/${ resource }`, params );

  return store.dispatch('cluster/request', { url });
}

/**
 * Fetch a list of available AKS regions
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param clusterId (optional) norman cluster id
 * @returns Array of regions in the form {name, displayName}
 */

export async function getAKSRegions(store: Store<any>, azureCredentialSecret: string, clusterId?: string) :Promise<any> {
  return getAKSOptions(store, azureCredentialSecret, '', 'aksLocations', clusterId );
}

/**
 * Fetch a list of available VM sizes for a given AKS region. Note that this can push 1k results
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param resourceLocation any valid AKS region
 * @param clusterId (optional) norman cluster id
 * @returns An array of strings
 */
export async function getAKSVMSizes(store: Store<any>, azureCredentialSecret: string, resourceLocation: string, clusterId?: string) :Promise<any> {
  return getAKSOptions(store, azureCredentialSecret, resourceLocation, 'aksVMSizes', clusterId );
}

/**
 * Fetch a list of the available kubernetes versions for a given region. This may include versions outside of what Rancher supports
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param resourceLocation any valid AKS region
 * @param clusterId (optional) norman cluster id
 * @returns Array of versions
 */
export async function getAKSKubernetesVersions(store: Store<any>, azureCredentialSecret: string, resourceLocation: string, clusterId?: string) :Promise<any> {
  return getAKSOptions(store, azureCredentialSecret, resourceLocation, 'aksVersions', clusterId );
}

/**
 * Fetch available virtual networks in a given region.
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param resourceLocation any valid AKS region
 * @param clusterId (optional) norman cluster id
 * @returns {[AKSVirtualNetwork]}
 */
export async function getAKSVirtualNetworks(store: Store<any>, azureCredentialSecret: string, resourceLocation: string, clusterId?: string) :Promise<any> {
  return getAKSOptions(store, azureCredentialSecret, resourceLocation, 'aksVirtualNetworks', clusterId );
}

/**
 * Fetch available AKS clusters.
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @returns {[AKSVirtualNetwork]}
 */
export async function getAKSClusters(store: Store<any>, azureCredentialSecret: string) :Promise<any> {
  return getAKSOptions(store, azureCredentialSecret, null, 'aksClusters' );
}
