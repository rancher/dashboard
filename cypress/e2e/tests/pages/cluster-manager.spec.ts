const { baseUrl } = Cypress.config();
const clusterManagerPath = `${ baseUrl }/c/local/manager/provisioning.cattle.io.cluster`;
const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const timestamp = +new Date();
const clusterNamePartial = `e2e-test-create`;
const clusterName = `${ clusterNamePartial }-${ timestamp }`;
const clusterNameImport = `${ clusterNamePartial }-${ timestamp }-import`;

describe('Cluster Manager', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('using RKE2', () => {
    describe('given custom selection', () => {
      it('can create new cluster', () => {
        cy.userPreferences();
        cy.visit(clusterManagerPath);
        cy.getId('cluster-manager-list-create').click();
        cy.getId('cluster-manager-create-rke-switch').click();
        cy.getId('cluster-manager-create-grid-2-0').click();
        cy.getId('name-ns-description-name').type(clusterName);
        cy.getId('rke2-custom-create-save').click();

        cy.url().should('include', `${ clusterManagerPath }/fleet-default/${ clusterName }#registration`);
      });

      it('can create new imported generic cluster', () => {
        cy.visit(clusterManagerPath);
        cy.getId('cluster-manager-list-import').click();
        cy.getId('cluster-manager-create-grid-1-0').click();
        cy.getId('name-ns-description-name').type(clusterNameImport);
        cy.getId('cluster-manager-import-save').click();

        cy.url().should('include', `${ clusterManagerPath }/fleet-default/${ clusterNameImport }#registration`);
      });

      it('can navigate to local cluster explore product', () => {
        const clusterName = 'local';

        cy.visit(clusterManagerPath);
        // Click explore button for the cluster row within the table matching given name
        cy.contains(clusterName).parent().parent().parent()
          .within(() => cy.getId('cluster-manager-list-explore-management').click());

        cy.url().should('include', `/c/${ clusterName }/explorer`);
      });

      it(`can see cluster's details`, () => {
        cy.visit(clusterManagerPath);
        // Click action menu button for the cluster row within the table matching given name
        cy.contains(clusterName).parent().parent().parent()
          .within(() => cy.getId('-action-button', '$').click());
        cy.getId('action-menu-0-item').click();

        cy.contains(`Custom - ${ clusterName }`).should('exist');
      });

      it('can view cluster YAML editor', () => {
        cy.visit(clusterManagerPath);
        // Click action menu button for the cluster row within the table matching given name
        cy.contains(clusterName).parent().parent().parent()
          .within(() => cy.getId('-action-button', '$').click());
        cy.getId('action-menu-1-item').click();
        cy.getId('yaml-editor-code-mirror').contains(clusterName);
      });

      it('can edit cluster and see changes afterwards', () => {
        cy.intercept('PUT', `${ clusterRequestBase }/${ clusterName }`).as('saveRequest');

        cy.visit(clusterManagerPath);
        // Click action menu button for the cluster row within the table matching given name
        cy.contains(clusterName).parent().parent().parent()
          .within(() => cy.getId('-action-button', '$').click());
        cy.getId('action-menu-0-item').click();
        cy.getId('name-ns-description-description').type(clusterName);
        cy.getId('rke2-custom-create-save').click();

        cy.wait('@saveRequest').then(() => {
          cy.visit(`${ clusterManagerPath }/fleet-default/${ clusterName }?mode=edit#basic`);
          cy.getId('name-ns-description-description').find('input').should('have.value', clusterName);
        });
      });
      it('can delete cluster', () => {
        cy.intercept('DELETE', `${ clusterRequestBase }/${ clusterName }`).as('deleteRequest');

        cy.visit(clusterManagerPath);
        // Click action menu button for the cluster row within the table matching given name
        cy.contains(clusterName).as('rowCell').parent().parent()
          .parent()
          .within(() => cy.getId('-action-button', '$').click());
        cy.getId('action-menu-4-item').click();
        cy.getId('prompt-remove-input').type(clusterName);
        cy.getId('prompt-remove-confirm-button').click();

        cy.wait('@deleteRequest').then(() => {
          cy.get('@rowCell').should('not.exist');
        });
      });

      it('can delete multiple clusters', () => {
        cy.intercept('DELETE', `${ clusterRequestBase }/${ clusterNameImport }`).as('deleteRequest');

        cy.visit(clusterManagerPath);
        // Get row from a given name
        cy.contains(clusterNameImport).as('rowCell')
          // Click checkbox for the cluster row within the table matching given name
          .parent().parent()
          .parent()
          .within(() => cy.getId('-checkbox', '$').click({ multiple: true }));
        // Single buttons are replaced with action menu on mobile
        cy.getId('sortable-table-promptRemove').click({ force: true });
        cy.get('@rowCell').then((row) => {
          // In the markdown we have ALWAYS whitespace
          cy.getId('prompt-remove-input').type(row.text().trim());
        });
        cy.getId('prompt-remove-confirm-button').click();

        cy.wait('@deleteRequest').then(() => {
          cy.get('@rowCell').should('not.exist');
        });
      });
    });
  });
});
