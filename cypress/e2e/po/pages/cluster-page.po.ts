import PagePo from '@/cypress/e2e/po/pages/page.po';

export default abstract class ClusterPage extends PagePo {
  private static createPath(clusterId: string, pathAfterCluster: string) {
    return `/c/${ clusterId }/${ pathAfterCluster }`;
  }

  /**
   * Fetch the cluster id from the url... (note - you need to be on a cluster page for this to work)
   */
  static clusterId() {
    return cy.url().then((url: string) => /\/c\/([a-z\-_]*)\/\S*/.exec(url)?.[1]);
  }

  constructor(clusterId = '_', pathAfterCluster = '') {
    super(ClusterPage.createPath(clusterId, pathAfterCluster));
  }
}
