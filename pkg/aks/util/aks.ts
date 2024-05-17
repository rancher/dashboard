
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
  koreacentral:       true,
  eastus2:            true,
  northeurope:        true,
  southeastasia:      true,
  southcentral:       true,
  us:                 true,
  uksouth:            true,
  eastasia:           true,
  usgovvirginia:      true,
  westeurope:         true,
  chinanorth3:        true,
  westus2:            true,
  swedencentral:      true,
  westus3:            true,
  switzerlandnorth:   true,
  polandcentral:      true
} as any;

/**
 *
 * @param store vuex store used to make the GET request
 * @param azureCredentialSecret id of an azure cloud credential
 * @param resourceLocation any valid AKS region
 * @param clusterId (optional) norman cluster id
 * @param resource AKS resource to be fetched - one of aksLocations, aksVersions, aksVMSizes, aksVirtualNetworks
 */
async function getAKSOptions(store: any, azureCredentialSecret: string, resourceLocation: string, resource: string, clusterId?: string) :Promise<any> {
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

export const EFFECT_OPTIONS = ['PreferNoSchedule', 'NoExecute', 'NoSchedule'];

/**
 *
 * @param taint AKS node pool taint in the format key:value=effect
 * @returns an object containing key, value, and effect keys
 */
export function parseTaint(taint: string): {key:string, value: string, effect: string} {
  const [key = '', valueEffect = ''] = (taint || '').split('=');
  const [value = '', effect = EFFECT_OPTIONS[0]] = valueEffect.split(':');

  return {
    key, effect, value
  };
}

/**
 * Accepts key, value, and effect options -- separated to manipulate in the form -- and formats them into one string as the aks node pool spec requires
 * @param key taint key
 * @param value taint value
 * @param effect taint effect - one of EFFECT_OPTIONS
 * @returns string in the format key:value=effect
 */
export function formatTaint(key = '', value = '', effect = EFFECT_OPTIONS[0]): string {
  return `${ key }:${ value }=${ effect }`;
}
