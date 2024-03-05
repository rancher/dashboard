import NodeDriverListPagePo from '@/cypress/e2e/po/pages/cluster-manager/drivers/node-driver-list.po';

describe('Node Drivers', () => {
  const driverList = new NodeDriverListPagePo('local');

  beforeEach(() => {
    cy.login();
    driverList.goTo();
  });
  it('should show the node drivers list page', () => {
    cy.contains('.title > h1', ' Node Drivers ').should('be.visible');
    driverList.sortableTable().checkVisible();

    // Wait for loading indicator to go
    driverList.sortableTable().checkLoadingIndicatorNotVisible();
  });
});
