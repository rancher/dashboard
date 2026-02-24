import { KubeMetadata } from '@shell/types/kube/kube-api';

export interface KubeNodeTaint {
  key: string,
  effect: string,
}

export interface KubeNode {
  metadata: KubeMetadata,
  spec: {
    taints: KubeNodeTaint[],
    [key: string]: any,
  }
  [key: string]: any,
}
