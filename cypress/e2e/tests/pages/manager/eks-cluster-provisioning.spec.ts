import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-amazon.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import ClusterManagerCreateEKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-eks.po';
import AmazonCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-amazon.po';

/******
 *  Running this test will delete all Amazon cloud credentials from the target cluster
 ******/

describe('Create EKS cluster', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let removeCloudCred = false;
  let cloudcredentialId = '';
  let k8sVersion = '';
  let clusterId = '';
  const eksDefaultRegion = 'us-west-2';

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up amazon cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.amazonec2credentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing amazon cloud credentials to delete');
          }
        });
      }
    });
  });

  beforeEach(() => {
    cy.createE2EResourceName('ekscluster').as('eksClusterName');
    cy.createE2EResourceName('ekscloudcredential').as('eksCloudCredentialName');
  });

  it('can create an Amazon EKS cluster with default values', function() {
    const createEKSClusterPage = new ClusterManagerCreateEKSPagePo();
    const cloudCredForm = createEKSClusterPage.cloudCredentialsForm();

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createEKSClusterPage.selectKubeProvider(0);
    loadingPo.checkNotExists();
    createEKSClusterPage.rke2PageTitle().should('include', 'Create Amazon EKS');
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2');

    // create amazon cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cloudCredForm.nameNsDescription().name().set(this.eksCloudCredentialName);
    cloudCredForm.accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredForm.secretKey().set(Cypress.env('awsSecretKey'));
    cloudCredForm.secretKey().set(Cypress.env('awsSecretKey'));
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', '/v1/management.cattle.io.users?exclude=metadata.managedFields').as('pageLoad');
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id.replace(':', '%3A');
      // removeCloudCred = true;
    });

    
    cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
    loadingPo.checkNotExists();
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2#group1%200');
    createEKSClusterPage.getClusterName().set(this.eksClusterName);
    createEKSClusterPage.getClusterDescription().set(`${ this.eksClusterName }-description`);

    //Get latest kubernetes version
    // cy.wait('@getRke2Releases').then(({ response }) => {
    //   expect(response.statusCode).to.eq(200);
    //   const length = response.body.data.length - 1;

    //   k8sVersion = response.body.data[length].id;
    //   cy.wrap(k8sVersion).as('k8sVersion');
    // });

    // cy.get<string>('@k8sVersion').then((version) => {
    //   createEKSClusterPage.basicsTab().kubernetesVersions().toggle();
    //   createEKSClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(version);

    cy.intercept('POST', 'v3/clusters').as('createEKSCluster');
    createEKSClusterPage.create();
    cy.wait('@createEKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.eksClusterName);
      expect(response?.body).to.have.property('description', `${ this.eksClusterName }-description`);
      // expect(response?.body.spec).to.have.property('kubernetesVersion').contains(version);
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.eksClusterName).should('contain.text', 'Provisioning');
  });

  after('clean up', () => {
    // delete cluster
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ clusterId }`, false);

    // clean up Amazon cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.amazonec2credentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing Amazon cloud credentials to delete');
          }
        });
      }
    });
});
});
