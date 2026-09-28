import { GKENetwork, GKESubnetwork } from '@shell/components/google/types/gcp';

export interface GKENetworkOption extends Partial<GKENetwork>{
  label: string,
  kind?: string,
  disabled?: boolean,
}

export interface GKESubnetworkOption extends Partial<GKESubnetwork>{
  label: string,
}
