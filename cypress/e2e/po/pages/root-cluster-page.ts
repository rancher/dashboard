import PagePo from '~/cypress/e2e/po/pages/page.po';

/**
 * Use this for pages with the `_c` notation that changes given cluster context
 */
export default class RootClusterPage extends PagePo {
  static getClusterIdFromUrl() {
    cy.url().should('include', '/c/');

    return cy.url().then((url) => {
      const parts = url.split('/');

      const clusterKey = parts.findIndex(part => part === 'c');

      if (clusterKey <= 0) {
        throw new Error('Cannot find /c/ part of url');
      }

      return parts[clusterKey + 1];
    });
  }

  updatePathWithCurrentCluster() {
    return RootClusterPage.getClusterIdFromUrl().then((clusterIdFromUrl) => {
      this.path = this.path.replace('_', clusterIdFromUrl);
    });
  }

  waitForPageWithClusterId(params?: string, fragment?: string) {
    return this.updatePathWithCurrentCluster().then(() => super.waitForPage(params, fragment));
  }
}
