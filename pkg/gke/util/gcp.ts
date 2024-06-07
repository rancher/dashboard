import { addParams, QueryParams } from '@shell/utils/url';
import {
  getGKEMachineTypesResponse,
  getGKEClustersResponse,
  getGKENetworksResponse,
  getGKESharedSubnetworksResponse,
  getGKESubnetworksResponse,
  getGKEVersionsResponse,
  GKEZone,
  getGKEZonesResponse,
  getGKEServiceAccountsResponse
} from 'types/gcp';
import { Store } from 'vuex';

// If any of these defaults are not available in the actual list from gcp, the ui will default to the first option in the (sorted) list
export const DEFAULT_GCP_ZONE = 'us-central1-c';
export const DEFAULT_GCP_REGION = 'us-central1';

export const DEFAULT_GCP_SERVICE_ACCOUNT = 'Compute Engine default service account';
/**
 * @param resource gcp resource to fetch eg gkeZones
 * @param store vuex store used to dispatch management/request
 * @param cloudCredentialId gcp credential id - will be in the form cattle-global-data:<random string>
 * @param projectId gcp project in which to make the request
 * @param location object containing either gcp region or zone in which to make the request - defaults to DEFAULT_GCP_ZONE if both zone and region are undefined. region preempts zone
 * @returns
 */
function getGKEOptions(resource: string, store: any, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}, clusterId?:string ) {
  if (!cloudCredentialId || !projectId) {
    return;
  }
  if (!location.zone && !location.region) {
    location.zone = DEFAULT_GCP_ZONE;
  }
  let params: QueryParams = {};

  if (location.region) {
    params = {
      cloudCredentialId, projectId, region: location.region
    };
  } else if (location.zone) {
    params = {
      cloudCredentialId, projectId, zone: location.zone

    };
  }
  if (clusterId) {
    params.clusterId = clusterId;
  }

  const url = addParams(`/meta/${ resource }`, params);

  return store.dispatch('management/request', {
    url,
    method:               'POST',
    redirectUnauthorized: false,
  });
}

export function getGKEZones(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKEZonesResponse> {
  return getGKEOptions('gkeZones', store, cloudCredentialId, projectId, location);
}

export async function getGKEVersions(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKEVersionsResponse> {
  return await getGKEOptions('gkeVersions', store, cloudCredentialId, projectId, location);
}

export function getGKEMachineTypes(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKEMachineTypesResponse> {
  return getGKEOptions('gkeMachineTypes', store, cloudCredentialId, projectId, { zone: location.zone });
}

export function getGKENetworks(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKENetworksResponse> {
  return getGKEOptions('gkeNetworks', store, cloudCredentialId, projectId, location);
}

export function getGKESubnetworks(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKESubnetworksResponse> {
  return getGKEOptions('gkeSubnetworks', store, cloudCredentialId, projectId, location);
}

export function getGKESharedSubnetworks(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKESharedSubnetworksResponse> {
  // return getGKEOptions('gkeSharedSubnets', store, cloudCredentialId, projectId, location);
  // TODO nb remove this test code
  return Promise.resolve({
    id:          '1234',
    kind:        'faked',
    selfLink:    'abc',
    subnetworks: [
      {
        ipCidrRange: '10.3.0.0/24',
        network:     'projects/host-project-309915/global/networks/host-shared-vpc',
        subnetwork:  'projects/host-project-309915/regions/us-west1/subnetworks/host-shared-vpc-us-west1-subnet-public'
      },
      {
        ipCidrRange: '10.4.0.0/24',
        network:     'projects/host-project-309915/global/networks/host-shared-vpc',
        subnetwork:  'projects/host-project-309915/regions/us-west1/subnetworks/host-shared-vpc-us-west1-subnet-private'
      },
      {
        ipCidrRange:       '10.2.0.0/24',
        network:           'projects/host-project-309915/global/networks/host-shared-vpc',
        secondaryIpRanges: [
          {
            ipCidrRange: '10.7.0.0/21',
            rangeName:   'pods',
            status:      'UNUSED'
          },
          {
            ipCidrRange: '10.8.0.0/21',
            rangeName:   'services',
            status:      'UNUSED'
          }
        ],
        subnetwork: 'projects/host-project-309915/regions/us-east1/subnetworks/host-shared-vpc-us-east1-subnet-private'
      },
      {
        ipCidrRange:       '10.1.0.0/24',
        network:           'projects/host-project-309915/global/networks/host-shared-vpc',
        secondaryIpRanges: [
          {
            ipCidrRange: '10.5.0.0/21',
            rangeName:   'pods',
            status:      'UNUSED'
          },
          {
            ipCidrRange: '10.6.0.0/21',
            rangeName:   'services',
            status:      'UNUSED'
          }
        ],
        subnetwork: 'projects/host-project-309915/regions/us-east1/subnetworks/host-shared-vpc-us-east1-subnet-public'
      }
    ]
  });
}

export function getGKEClusters(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}, clusterId: string): Promise<getGKEClustersResponse> {
  return getGKEOptions('gkeClusters', store, cloudCredentialId, projectId, location, clusterId);
}

export function getGKEServiceAccounts(store: Store<any>, cloudCredentialId: string, projectId: string, location: {zone?: string, region?: string}): Promise<getGKEServiceAccountsResponse> {
  return getGKEOptions('gkeServiceAccounts', store, cloudCredentialId, projectId, location);
}

/**
 * we fetch GKE zones and etrapolate available regions from that list. Zones include a url to the region they are in.
 * @param zone
 * @returns region the zone is contained in
 */
export function regionFromZone(zone: GKEZone): string|undefined {
  const regionUrl = zone.region || '';

  return regionUrl.split('/').pop();
}

/** The Ember logic around image types is more complicated; it includes docker variants and windows SAC, with version-dependent availability
 * the gke versions supporting those options are well outside the versions that will be supported in rancher 2.9
 * No windows SAC since 2022 https://cloud.google.com/kubernetes-engine/docs/deprecations/windows-server-sac
 * No more docker (non _containerd) since gke 1.24 https://cloud.google.com/kubernetes-engine/docs/concepts/node-images
 * We will simply exclude those options from the UI and display a warning if the user is editing a cluster with one of them already configured
 */
export const imageTypes = [
  'COS_CONTAINERD',
  'WINDOWS_LTSC_CONTAINERD',
  'UBUNTU_CONTAINERD',
];
