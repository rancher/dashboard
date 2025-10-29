import { GKESubnetwork, GKENetwork } from '@shell/components/google/types/gcp';
import { GKENetworkOption, GKESubnetworkOption } from '@shell/components/google/types';
import { Translation } from '@shell/types/t';

const GKE_NONE_OPTION = 'none';

export function formatSharedNetworks(allSharedSubnetworks: GKESubnetwork[]): {[key: string]: GKESubnetwork[]} {
  const networks: {[key: string]: GKESubnetwork[]} = {};

  allSharedSubnetworks.forEach((s) => {
    if (!s.network) {
      return;
    }
    const network = s.network.split('/').pop() || s.network;

    if (!networks[network]) {
      networks[network] = [];
    }
    networks[network].push(s);
  });

  return networks;
}

export function formatNetworkOptions(t: Translation, networks: GKENetwork[], subnetworks: GKESubnetwork[], sharedNetworks: { [key: string]: GKESubnetwork[]; }): GKENetworkOption[] {
  const out: GKENetworkOption[] = [];
  const unshared = (networks || []).map((n) => {
    const subnetworksAvailable = subnetworks?.find((s) => s?.network === n?.selfLink);

    return { ...n, label: subnetworksAvailable ? `${ n.name } (${ t('gke.network.subnetworksAvailable') })` : n.name };
  });
  const shared = (Object.keys(sharedNetworks) || []).map((n: string) => {
    const firstSubnet = sharedNetworks[n][0];

    return {
      name: n, label: `${ n } (${ t('gke.network.subnetworksAvailable') })`, ...firstSubnet
    };
  });

  if (shared.length) {
    out.push({
      label:    t('gke.network.sharedvpc'),
      kind:     'group',
      disabled: true,
      name:     'shared'
    }, ...shared);
  } if (unshared.length) {
    out.push({
      label:    t('gke.network.vpc'),
      kind:     'group',
      disabled: true,
      name:     'unshared'
    }, ...unshared);
  }

  return out;
}

export function formatSubnetworkOptions(t: Translation, network: string, subnetworks: GKESubnetwork[], sharedNetworks: { [key: string]: GKESubnetwork[]; }, useIpAliases = false): GKESubnetworkOption[] {
  const out: any[] = [];
  const isShared = !!sharedNetworks[network];

  if (isShared) {
    out.push(...sharedNetworks[network]);
  } else {
    out.push(...(subnetworks.filter((s) => s?.network?.split('/')?.pop() === network) || []));
  }

  const labeled: GKESubnetworkOption[] = out.map((sn: GKESubnetwork) => {
    const shortName = sn.name ? sn.name : (sn.subnetwork || '').split('/').pop();
    const fullName = sn.subnetwork || sn.selfLink || shortName;

    return {
      ...sn,
      name:  fullName,
      label: `${ shortName } (${ sn.ipCidrRange })`
    };
  });

  if (useIpAliases) {
    labeled.unshift({ label: t('gke.subnetwork.auto'), name: GKE_NONE_OPTION });
  }

  return labeled;
}
