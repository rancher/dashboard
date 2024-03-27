import { dummyNode } from '@/cypress/e2e/blueprints/explorer/nodes';
import ResourceTable from '@/cypress/e2e/po//components/resource-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Nodes list', { tags: ['@explorer', '@adminUser'], testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    // Add dummy node that used to cause a problem
    cy.createRancherResource('v1', 'nodes', JSON.stringify(dummyNode));
  });

  after(() => {
    // Ensure we delete the dummy node
    cy.deleteRancherResource('v1', 'nodes', 'bigip1');
  });

  it('should show the nodes list page', () => {
    ClusterDashboardPagePo.navTo();

    const nav = new ProductNavPo();

    nav.navToSideMenuEntryByLabel('Nodes');

    cy.contains('.title > h1', 'Nodes').should('be.visible');

    const nodeList = new ResourceTable('[data-testid="cluster-node-list"]');

    nodeList.sortableTable().checkVisible();

    // Wait for loading indicator to go
    nodeList.sortableTable().checkLoadingIndicatorNotVisible();

    // Check table has 2 tows
    nodeList.sortableTable().rowElements({ timeout: 2500 }).should((rows: any) => {
      expect(rows).not.to.equal(undefined);
      expect(rows).to.have.length(2);
    });

    // Check the node names
    nodeList.sortableTable().rowNames().should((names: any) => {
      expect(names).to.have.length(2);
      // expect(names).to.contain('local-node');
      expect(names).to.contain('bigip1');
    });

    // Simple test to assert we haven't broken Node detail page
    // https://github.com/rancher/dashboard/issues/10490
    nodeList.sortableTable().rowElementLink(0, 2).click();
    cy.get('.title .primaryheader h1').invoke('text').should('contain', 'Node:');
  });
});
