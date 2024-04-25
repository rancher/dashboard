import { isArray } from '@shell/utils/array';
import { set, get } from '@shell/utils/object';
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

/**
 * Hosted provider (aks gke eks) edit functionality differs from other k8s resources
 * see ui issue: https://github.com/rancher/rancher/issues/28541
 * backend issue: https://github.com/rancher/rancher/issues/28422
 * The below code is taken from the rancher/ui implementation https://github.com/rancher/ui/blob/master/app/models/cluster.js#L1368
 */

function isEmptyObject(object: any) {
  return Object.keys(object).length === 0;
}

function isObject(val: any) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

function isEmptyStringOrArray(val: any) {
  return val === null || val === undefined || val === '' || (isArray(val) && val.length === 0);
}

/**
 * this is NOT a generic object diff.
 * It tries to be as generic as possible but it does make certain assumptions regarding nulls and emtpy arrays/objects
 * if upstream is null and local aks config is empty we do not count this as a change
 * additionally null values on the RHS will be ignored as null cant be sent in this case
 * nodeGroups, nodePools, tags, and labels are not diffed
 * @param upstream aksStatus.upstreamSpec
 * @param local aksConfig
 * @returns aksConfig containing only values which differ from upstream spec, excluding null values
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function diffUpstreamSpec(upstream: any, local: any): any {
  const delta = {};
  const localKeys = Object.keys(local);

  localKeys.forEach((key) => {
    if (key === 'type') {
      return;
    }

    const upstreamMatch = get(upstream, key);
    const localMatch = get(local, key);

    if (key !== 'nodeGroups' && key !== 'nodePools') {
      try {
        if (JSON.stringify(upstreamMatch) === JSON.stringify(localMatch)) {
          return;
        }
      } catch (e) {}
    }

    if (key === 'nodeGroups' || key === 'nodePools' || key === 'tags' || key === 'labels') {
      // Node Groups and Node Pools do not require a sync, we can safely send the entire object
      // Tags and Labels (maps) are also included by default because what is present in the config is exactly what should be used on save and any equal maps would have been caught by the JSON isEqual comparison above
      if (!isEmptyStringOrArray(localMatch)) {
        // node groups need ALL data so short circut and send it all
        set(delta, key, localMatch);
      } else {
        // all node groups were deleted
        set(delta, key, []);
      }

      return;
    }

    if (isEmptyStringOrArray(upstreamMatch) || isEmptyObject(upstreamMatch)) {
      if (isEmptyStringOrArray(localMatch) || isEmptyObject(localMatch)) {
        if (upstreamMatch !== null && (isArray(localMatch) || isObject(localMatch))) {
          // Empty Arrays and Empty Maps must be sent as such unless the upstream value is null, then the empty array or obj is just an init value
          set(delta, key, localMatch);
        }
      } else {
        // upstream is empty, local is not, just set
        set(delta, key, localMatch);
      }
    } else {
      if (localMatch !== null) {
        // entry in og obj
        if (isArray(upstreamMatch)) {
          if (isArray(localMatch)) {
            if (!isEmptyStringOrArray(localMatch) && localMatch.every((m: any) => isObject(m))) {
              // You have more diffing to do
              localMatch.forEach((match: any) => {
                // our most likely candiate for a match is node group name, but lets check the others just incase.
                const matchId = get(match, 'name') || get(match, 'id') || false;

                if (matchId) {
                  let lmatchIdx = 0;

                  // we have soime kind of identifier to find a match in the upstream, so we can diff and insert to new array
                  const lMatch = upstreamMatch.find((l: any, idx: number) => {
                    const lmatchId = get(l, 'name') || get(l, 'id');

                    if (lmatchId === matchId) {
                      lmatchIdx = idx;

                      return l;
                    }
                  });

                  if (lMatch) {
                    // we have a match in the upstream, meaning we've probably made updates to the object itself
                    const diffedMatch = diffUpstreamSpec(lMatch, match);

                    if (!isArray(get(delta, key))) {
                      set(delta, key, [diffedMatch]);
                    } else {
                      const target: any[] = delta[key as keyof typeof delta];

                      // diff and push into new array
                      target.splice(lmatchIdx, 0, diffedMatch);
                    }
                  } else {
                    // no match in upstream, new entry
                    if (!isArray(get(delta, key))) {
                      set(delta, key, [match]);
                    } else {
                      const target: any = delta[key as keyof typeof delta];

                      target.push(match);
                    }
                  }
                } else {
                  // no match id, all we can do is dumb add
                  if (!isArray(get(delta, key))) {
                    set(delta, key, [match]);
                  } else {
                    const target: any = delta[key as keyof typeof delta];

                    target.push(match);
                  }
                }
              });
            } else {
              set(delta, key, localMatch);
            }
          } else {
            set(delta, key, localMatch);
          }
        } else if (isObject(upstreamMatch)) {
          if (!isEmptyStringOrArray(localMatch) && !isEmptyObject(localMatch)) {
            if ((Object.keys(upstreamMatch) || []).length > 0) {
              // You have more diffing to do
              set(delta, key, diffUpstreamSpec(upstreamMatch, localMatch));
            } else if (isEmptyObject(upstreamMatch)) {
              // we had a map now we have an empty map
              set(delta, key, {});
            }
          } else if (!isEmptyObject(upstreamMatch) && isEmptyObject(localMatch)) {
            // we had a map now we have an empty map
            set(delta, key, {});
          }
        } else { // upstreamMatch not an array or object
          set(delta, key, localMatch);
        }
      }
    }
  });

  return delta;
}
