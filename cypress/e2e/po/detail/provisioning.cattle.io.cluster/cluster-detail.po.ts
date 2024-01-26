import PagePo from '@/cypress/e2e/po/pages/page.po';

/**
 * Covers core functionality that's common to the dashboard's cluster detail pages
 */
export default abstract class ClusterManagerDetailPagePo extends PagePo {
  private static createPath(clusterId: string, clusterName: string, tab?: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerDetailPagePo.createPath(clusterId, clusterName));
  }
}
