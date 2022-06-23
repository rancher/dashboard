describe('Cluster', () => {
  beforeEach(() => {
    cy.login();
  });

  it.only('can create new local RKE2 custom cluster', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    cy.getId('cluster-manager-list-create').click();
    // toggle RKE2?
    cy.getId('cluster-manager-create-grid-2-0').click();
    cy.getId('name-ns-description-name').type('e2e-test-create');
    cy.getId('rke2-custom-create-save').click();
    cy.url().should('include', '/c/local/manager/provisioning.cattle.io.cluster/fleet-default/e2e-test-create#registration');
  });

  it('can import new cluster', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    cy.getId('cluster-manager-import').click();
    // click Generic
    // set name
    // click create
    // should display new cluster
  });

  it('can see cluster details', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    // should display Cluster: YOUR NAME
  });

  it('can explore the cluster', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    cy.getId('cluster-manager-list-explore').click();
    // should display Cluster Dashboard text
  });

  // it('can see cluster config', () => {
  //   cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
  //   // find cluster row
  //   // click action button cluster
  //   // click Edit Config
  //   // wait loading
  //   // display Cluster Configuration
  // });

  it('can edit cluster config', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    // find cluster row
    // click action button cluster
    // click Edit Config
    // wait loading
    // display Cluster Configuration
  });

  it('can see cluster YAML', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    // find cluster row
    // click action button cluster
    // click Edit Config
    // wait loading
    // display Cluster YAML
  });

  // it('can edit cluster YAML', () => {
  //   cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
  // });

  it('can delete cluster', () => {
    cy.visit('/c/local/manager/provisioning.cattle.io.cluster');
    // find cluster row
    // click action button cluster
    // click Delete
    // wait loading
    // cluster should not exist
  });
});
