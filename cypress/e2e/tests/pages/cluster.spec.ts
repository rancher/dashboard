const clusterManagerPath = '/c/local/manager/provisioning.cattle.io.cluster';
const timestamp = +new Date();
const clusterName = `e2e-test-create-${ timestamp }`;

describe('Cluster', () => {
  beforeEach(() => {
    cy.login();
  });

  it.only('can create new local RKE2 custom cluster', () => {
    cy.visit(clusterManagerPath);
    cy.getId('cluster-manager-list-create').click();
    // toggle RKE2?
    cy.getId('cluster-manager-create-grid-2-0').click();
    cy.getId('name-ns-description-name').type(clusterName);
    cy.getId('rke2-custom-create-save').click();
    cy.url().should('include', `${ clusterManagerPath }/fleet-default/${ clusterName }#registration`);
  });

  it('can import new cluster', () => {
    cy.visit(clusterManagerPath);
    cy.getId('cluster-manager-import').click();
    // click Generic
    // set name
    // click create
    // should display new cluster
  });

  it.only('can see cluster details', () => {
    cy.visit(clusterManagerPath);
    cy.contains(clusterName).parent().parent().parent()
      .as('row')
      .within(() => cy.getId('-action-button', '$').click());
    cy.getId('action-menu-0-item').click();
    cy.contains(`Custom - ${ clusterName }`).should('exist');
  });

  it('can explore the cluster', () => {
    cy.visit(clusterManagerPath);
    cy.getId('cluster-manager-list-explore').click();
    // should display Cluster Dashboard text
  });

  // it('can see cluster config', () => {
  //   cy.visit(clusterManagerPath);
  //   // find cluster row
  //   // click action button cluster
  //   // click Edit Config
  //   // wait loading
  //   // display Cluster Configuration
  // });

  it('can edit cluster config', () => {
    cy.visit(clusterManagerPath);
    // find cluster row
    // click action button cluster
    // click Edit Config
    // wait loading
    // display Cluster Configuration
  });

  it('can see cluster YAML', () => {
    cy.visit(clusterManagerPath);
    // find cluster row
    // click action button cluster
    // click Edit Config
    // wait loading
    // display Cluster YAML
  });

  // it('can edit cluster YAML', () => {
  //   cy.visit(clusterManagerPath);
  // });

  it.only('can delete cluster', () => {
    cy.visit(clusterManagerPath);
    cy.contains(clusterName).parent().parent().parent()
      .as('row')
      .within(() => cy.getId('-action-button', '$').click());
    cy.getId('action-menu-4-item').click();
    cy.getId('prompt-remove-input').type(clusterName);
    cy.getId('prompt-remove-confirm-button').click();
    cy.contains(clusterName).should('not.exist');
  });
});
