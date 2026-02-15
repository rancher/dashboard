import HostedProvidersPagePo from '@/cypress/e2e/po/pages/cluster-manager/hosted-providers.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';

describe('Hosted Providers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const providersPage = new HostedProvidersPagePo();
  const clusterList = new ClusterManagerListPagePo();
  const createCluster = new ClusterManagerCreatePagePo();

  const AKS = 'Azure AKS';
  const EKS = 'Amazon EKS';
  const GKE = 'Google GKE';

  before(() => {
    cy.login();
  });

  it('should show the hosted providers list page', () => {
    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();
    providersPage.title().should('be.visible');
    providersPage.list().resourceTable().sortableTable().checkVisible();
    providersPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('can deactivate provider', () => {
    const expected = {
      aks: false, eks: true, gke: true
    };

    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('updateProviders');

    providersPage.list().actionMenu(AKS).getMenuItem('Deactivate').click();

    cy.wait('@updateProviders').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      const resValue = JSON.parse(request.body.value);

      resValue.forEach((item: any) => {
        if (item.name in expected) {
          const state = item['active'];

          expect(state).to.eq(expected[item.name]);
        }
      });
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(AKS, 'not.exist');
  });

  it('can activate provider', () => {
    const expected = {
      aks: true, eks: true, gke: true
    };

    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('updateProviders');

    providersPage.list().actionMenu(AKS).getMenuItem('Activate').click();

    cy.wait('@updateProviders').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      const resValue = JSON.parse(request.body.value);

      resValue.forEach((item: any) => {
        if (item.name in expected) {
          const state = item['active'];

          expect(state).to.eq(expected[item.name]);
        }
      });
    });

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(AKS, 'exist');
  });

  it('can deactivate drivers in bulk', () => {
    const expected = {
      aks: true, eks: false, gke: false
    };

    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();
    providersPage.list().details(EKS, 1).should('contain', 'Active');
    providersPage.list().details(GKE, 1).should('contain', 'Active');
    // Check EKS checkbox: verify not checked -> click -> verify checked
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .isNotChecked();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .set();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .isChecked();

    // Check GKE checkbox: verify not checked -> click -> verify checked
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .isNotChecked();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .set();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .isChecked();

    cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('updateProviders');

    providersPage.list().deactivate().click();
    cy.wait('@updateProviders').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      const resValue = JSON.parse(request.body.value);

      resValue.forEach((item: any) => {
        if (item.name in expected) {
          const state = item['active'];

          expect(state).to.eq(expected[item.name]);
        }
      });
    });

    // Wait for UI to reflect the deactivation
    providersPage.list().details(EKS, 1).should('contain', 'Inactive');
    providersPage.list().details(GKE, 1).should('contain', 'Inactive');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(EKS, 'not.exist');
    createCluster.gridElementExistanceByName(GKE, 'not.exist');
  });

  it('can activate drivers in bulk', () => {
    const expected = {
      aks: true, eks: true, gke: true
    };

    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    // Ensure the table is fully loaded before checking states
    providersPage.list().resourceTable().sortableTable().checkVisible();
    providersPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    // Explicitly ensure EKS and GKE are in Inactive state before bulk activation
    // Check current state and deactivate if needed
    providersPage.list().details(EKS, 1).then(($el) => {
      if ($el.text().includes('Active')) {
        cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('deactivateEKS');
        providersPage.list().actionMenu(EKS).getMenuItem('Deactivate').click();
        cy.wait('@deactivateEKS');
        providersPage.list().details(EKS, 1).should('contain', 'Inactive');
      }
    });

    providersPage.list().details(GKE, 1).then(($el) => {
      if ($el.text().includes('Active')) {
        cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('deactivateGKE');
        providersPage.list().actionMenu(GKE).getMenuItem('Deactivate').click();
        cy.wait('@deactivateGKE');
        providersPage.list().details(GKE, 1).should('contain', 'Inactive');
      }
    });

    // Ensure both providers are now inactive
    providersPage.list().details(EKS, 1).should('contain', 'Inactive');
    providersPage.list().details(GKE, 1).should('contain', 'Inactive');

    // Check EKS checkbox: verify not checked -> click -> verify checked
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .isNotChecked();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .set();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(EKS)
      .isChecked();

    // Check GKE checkbox: verify not checked -> click -> verify checked
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .isNotChecked();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .set();
    providersPage.list().resourceTable().sortableTable().rowSelectCtlWithName(GKE)
      .isChecked();

    cy.intercept('PUT', `v1/management.cattle.io.settings/kev2-operators`).as('updateProviders');

    providersPage.list().activate().click();
    cy.wait('@updateProviders').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      const resValue = JSON.parse(request.body.value);

      resValue.forEach((item: any) => {
        if (item.name in expected) {
          const state = item['active'];
          const expectedState = expected[item.name as keyof typeof expected];

          expect(state).to.eq(expectedState);
        }
      });
    });
    providersPage.list().details(EKS, 1).should('contain', 'Active');
    providersPage.list().details(GKE, 1).should('contain', 'Active');

    // check options on cluster create page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createCluster.waitForPage();
    createCluster.gridElementExistanceByName(EKS, 'exist');
    createCluster.gridElementExistanceByName(GKE, 'exist');
  });
});
