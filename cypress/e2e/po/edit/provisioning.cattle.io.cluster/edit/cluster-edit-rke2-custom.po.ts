import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Edit page for an RKE2 custom cluster
 */
export default class ClusterManagerEditRke2CustomPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterId: string, clusterName: string, tab?: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterId: string, clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditRke2CustomPagePo.createPath(clusterId, clusterName));
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerEditRke2CustomPagePo.createPath(clusterId, clusterName));
  }
}
