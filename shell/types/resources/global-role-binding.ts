import { RancherKubeMetadata } from '@shell/types/rancher/steve.api';

/**
 * A management.cattle.io.globalrolebinding from the Steve API. It binds one principal (a user or a group) to a global role
 */
export interface GlobalRoleBinding {
  metadata: RancherKubeMetadata,
  globalRoleName: string,
  userName?: string,
  userPrincipalName?: string,
  groupPrincipalName?: string,
}
