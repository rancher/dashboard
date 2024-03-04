import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Covers core functionality that's common to the dashboard's import cluster pages
 */
export default class ClusterManagerImportPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/create`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerImportPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(ClusterManagerImportPagePo.createPath(clusterId));
  }

  selectKubeProvider(index: number) {
    return this.resourceDetail().cruResource().selectSubType(0, index).click();
  }

  selectGeneric(index: number) {
    return this.resourceDetail().cruResource().selectSubType(1, index).click();
  }
}
