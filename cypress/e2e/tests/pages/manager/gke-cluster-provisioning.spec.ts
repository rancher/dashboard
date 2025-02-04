import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import ClusterManagerCreateGKEPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-gke.po';
import { DEFAULT_GCP_ZONE } from '@/pkg/gke/util/gcp';

/******
 *  Running this test will delete all GKE cloud credentials from the target cluster
 ******/

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Deploy GKE cluster with default settings', { tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let cloudcredentialId = '';
  const gkeDefaultZone = 'us-central1-c';
  let gkeVersion = '';
  let clusterId = '';
  let clusterDescription = '';
  const base64EncodedServiceAccount = Cypress.env('gkeServiceAccount');
  let gkeProjectId = '';

  // Check if the base64 string is defined and valid
  if (base64EncodedServiceAccount) {
    try {
      // Decode the base64 string into a JSON string
      const decodedServiceAccountJson = atob(base64EncodedServiceAccount);

      // Parse the decoded JSON string
      const serviceAccount = JSON.parse(decodedServiceAccountJson);

      // Now you can access the project_id
      gkeProjectId = serviceAccount.project_id;
      /* eslint-disable no-console */
      console.log(gkeProjectId); // Check if the value is correct
    } catch (error) {
      // Handle any error that occurs during decoding or parsing
      console.error('Error decoding or parsing service account JSON:', error);
    }
  } else {
    console.warn('gkeServiceAccount environment variable is undefined or empty.');
  }

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up GKE cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.googlecredentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing GKE cloud credentials to delete');
          }
        });
      }
    });
  });

  beforeEach(() => {
    cy.createE2EResourceName('gkecluster').as('gkeClusterName');
    cy.createE2EResourceName('gkecloudcredential').as('gkeCloudCredentialName');
  });

  it('Successfully create GKE cluster with default settings', function() {
    const createGKEClusterPage = new ClusterManagerCreateGKEPagePo();
    const cloudCredForm = createGKEClusterPage.cloudCredentialsForm();

    // Select GKE and create GKE cluster page
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createGKEClusterPage.selectKubeProvider(2);
    loadingPo.checkNotExists();
    createGKEClusterPage.rke2PageTitle().should('include', 'Create Google GKE');
    createGKEClusterPage.waitForPage('type=googlegke&rkeType=rke2');

    // create GKE cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cloudCredForm.nameNsDescription().name().set(this.gkeCloudCredentialName);
    cloudCredForm.serviceAccount().set(Cypress.env('gkeServiceAccount'));
    cloudCredForm.saveButton().expectToBeEnabled();
    cy.intercept('GET', '/v1/management.cattle.io.users?exclude=metadata.managedFields').as('pageLoad');
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id.replace(':', '%3A');

      // Authenticate GKE credential by providing the Project ID
      createGKEClusterPage.waitForPage('type=googlegke&rkeType=rke2');
      createGKEClusterPage.authProjectId().set( gkeProjectId );
      cy.intercept('POST', `/meta/gkeVersions?cloudCredentialId=${ cloudcredentialId }&projectId=${ gkeProjectId }&zone=${ gkeDefaultZone }`).as('getGKEVersions');
      cloudCredForm.authenticateButton().click();
      cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
      loadingPo.checkNotExists();

      // Verify that gke-zone-select dropdown is set to the default zone
      createGKEClusterPage.waitForPage('type=googlegke&rkeType=rke2');
      ClusterManagerCreateGKEPagePo.getGkeZoneSelect().checkOptionSelected(DEFAULT_GCP_ZONE);

      // Get latest GKE kubernetes version and verify that gke-version-select dropdown is set to the default version as defined by versionOptions(); in Config.vue
      cy.wait('@getGKEVersions').then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        gkeVersion = response.body.validMasterVersions[0];
        cy.wrap(gkeVersion).as('gkeVersion');
        ClusterManagerCreateGKEPagePo.getGkeVersionSelect().checkOptionSelected(gkeVersion);
      });

      // Set the cluster name and description in the Create GKE Page
      createGKEClusterPage.getClusterName().set(this.gkeClusterName);
      clusterDescription = `${ this.gkeClusterName }-description`;
      createGKEClusterPage.getClusterDescription().set(clusterDescription);
    });

    // Create GKE Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createGKECluster');

    createGKEClusterPage.saveCreateGkeCluster().click();
    cy.wait('@createGKECluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('baseType', 'cluster');
      expect(response?.body.gkeConfig).to.have.property('clusterName', this.gkeClusterName);
      expect(response?.body).to.have.property('description', clusterDescription);
      expect(response?.body.gkeConfig).to.have.property('kubernetesVersion').contains(gkeVersion);
      clusterId = response?.body.id;
    });

    // Verify that the GKE created cluster is listed in the clusters list and has the Provisioning status
    clusterList.waitForPage();
    clusterList.list().state(this.gkeClusterName).should('contain.text', 'Provisioning');
  });

  after('clean up', () => {
    // delete cluster
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ clusterId }`, false);

    // clean up GKE cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.googlecredentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing GKE cloud credentials to delete');
          }
        });
      }
    });
  }
  );
});
