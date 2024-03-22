import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Covers core functionality that's common to the dashboard's edit cluster pages
 */
export default class ClusterManagerEditGenericPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterId: string, clusterName: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterId: string, clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditGenericPagePo.createPath(clusterId, clusterName));
  }

  constructor(clusterId = '_', clusterName) {
    super(ClusterManagerEditGenericPagePo.createPath(clusterId, clusterName));
  }
}
