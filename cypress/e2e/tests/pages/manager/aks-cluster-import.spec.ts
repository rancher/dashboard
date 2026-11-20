import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.po';
import ClusterManagerCreateAKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-aks.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import { cloudCredentialCreatePayloadAzure } from '@/cypress/e2e/blueprints/manager/cloud-credential-create-payload';

const CREDENTIAL_CONTEXT = 'aks-import-credential';
const CLUSTER_TO_REGISTER = {
  clusterName: 'existing-aks', resourceGroup: 'existing-aks-rg', location: 'eastus', rbacEnabled: true
};

describe('Import AKS cluster', { tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const importClusterPage = new ClusterManagerImportPagePo();
  const importAKSClusterPage = new ClusterManagerCreateAKSPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let credentialName = '';

  const deleteCredentialsFromThisSpec = () => {
    cy.getRancherResource('v3', 'cloudcredentials').then((resp: Cypress.Response<any>) => {
      resp.body.data
        .filter((credential: any) => credential.azurecredentialConfig && credential.name?.startsWith('e2e-test-') && credential.name.endsWith(CREDENTIAL_CONTEXT))
        .forEach((credential: any) => cy.deleteRancherResource('v3', 'cloudcredentials', credential.id));
    });
  };

  const openImportAKSForm = (clustersToImport: object[]) => {
    cy.intercept('GET', '/meta/aksLocations*', { statusCode: 200, body: [{ name: 'eastus', displayName: 'East US' }] });
    cy.intercept('GET', '/meta/aksClusters*', { statusCode: 200, body: clustersToImport }).as('aksClusters');

    clusterList.goTo();
    clusterList.waitForPage();
    clusterList.importCluster();
    importClusterPage.waitForPage('mode=import');
    importClusterPage.selectKubeProvider(1);
    loadingPo.checkNotExists();
    importAKSClusterPage.waitForPage('mode=import&type=aks&rkeType=rke2');
    importAKSClusterPage.rke2PageTitle().should('include', 'Import AKS');

    importAKSClusterPage.selectOptionForCloudCredentialWithLabel(credentialName);
    cy.wait('@aksClusters');

    importAKSClusterPage.getImportClusterName().set('e2e-aks-import');
  };

  before(() => {
    cy.login();
    deleteCredentialsFromThisSpec();

    cy.createE2EResourceName(CREDENTIAL_CONTEXT).then((name) => {
      credentialName = name;

      cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayloadAzure(
        name,
        'AzurePublicCloud',
        'e2eSubscriptionId',
        'e2eClientId',
        'e2eClientSecret'
      )));
    });
  });

  beforeEach(() => {
    cy.login();
  });

  it('keeps Create disabled when the credential has no clusters to import', () => {
    openImportAKSForm([]);

    importAKSClusterPage.getClusterToRegister().self().find('.vs__selected').should('not.exist');
    importAKSClusterPage.resourceDetail().createEditView().createButton().expectToBeDisabled();
  });

  it('enables Create only once a cluster to register is selected', () => {
    openImportAKSForm([CLUSTER_TO_REGISTER]);

    const createButton = importAKSClusterPage.resourceDetail().createEditView().createButton();

    createButton.expectToBeDisabled();

    importAKSClusterPage.getClusterToRegister().toggle();
    importAKSClusterPage.getClusterToRegister().clickOptionWithLabel(CLUSTER_TO_REGISTER.clusterName);
    importAKSClusterPage.getClusterToRegister().checkOptionSelected(CLUSTER_TO_REGISTER.clusterName);

    createButton.expectToBeEnabled();
  });

  after(() => {
    cy.login();
    deleteCredentialsFromThisSpec();
  });
});
