import ResourceTable from '@/cypress/e2e/po//components/resource-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import NodeDetailsPo from '@/cypress/e2e/po/detail/node.po';

describe('Node detail', { tags: ['@explorer2', '@adminUser'], testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('should still show the node detail view when the page is refreshed', () => {
    ClusterDashboardPagePo.navTo();

    const nav = new ProductNavPo();

    nav.navToSideMenuEntryByLabel('Nodes');

    cy.contains('.title > h1', 'Nodes').should('be.visible');

    const nodeList = new ResourceTable('[data-testid="cluster-node-list"]');

    nodeList.sortableTable().checkVisible();

    // Wait for loading indicator to go
    nodeList.sortableTable().checkLoadingIndicatorNotVisible();

    nodeList.sortableTable().rowNames().then((nodes) => {
      const node = nodes[0];

      nodeList.sortableTable().rowElementLink(0, 2).click();

      const nodeDetail = new NodeDetailsPo('local', node);

      nodeDetail.waitForPage();
      nodeDetail.mastheadTitle().should('contain', `${ node }`);

      cy.reload();

      nodeDetail.waitForPage();
      nodeDetail.mastheadTitle().should('contain', `${ node }`);
    });
  });
});
