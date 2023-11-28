import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import { dummyNode } from '@/cypress/e2e/blueprints/explorer/nodes';

describe('Nodes list', { tags: ['@adminUser'], testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    // Add dummy node that used ot cause a problem

    // cy.deleteRancherResource('v1', 'nodes', 'bigip1');
    cy.createRancherResource('v1', 'nodes', dummyNode);
  });

  after(() => {
    cy.deleteRancherResource('v1', 'nodes', 'bigip1');
  });

  it('should show the nodes list page', () => {
    ClusterDashboardPagePo.navTo();

    const nav = new ProductNavPo();

    nav.navToSideMenuEntryByLabel('Nodes');

    cy.contains('.title > h1', 'Nodes').should('be.visible');

    const nodeList = new BaseResourceList(cy.get('[data-testid="cluster-list-container"]'));

    // Wait for loading indicator to go
    cy.get('.data-loading').should('not.exist');

    // Check table has 2 tows
    nodeList.resourceTable().sortableTable().rowElements({ timeout: 2500 }).should((rows: any) => {
      expect(rows).not.to.equal(undefined);
      expect(rows).to.have.length(2);
    });

    // Check the node names
    nodeList.self().find('td.col-link-detail > span > a').then((links: any) => {
      cy.log(links);

      const names = Cypress.$.makeArray<string>(links).map((el: any) => el.innerText as string);

      expect(names).to.have.length(2);
      expect(names).to.contain('local-node');
      expect(names).to.contain('bigip1');
    });
  });
});
