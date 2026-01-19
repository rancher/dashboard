import { cloudCredentialCreatePayloadDO, cloudCredentialCreatePayloadAzure } from '@/cypress/e2e/blueprints/manager/cloud-credential-create-payload';
import { clusterProvDigitalOceanSingleResponse } from '@/cypress/e2e/blueprints/manager/digital-ocean-cluster-provisioning-response';
import { machinePoolConfigResponse } from '@/cypress/e2e/blueprints/manager/machine-pool-config-response';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import CloudCredentialsPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

/******
*  Running this test will delete all Amazon cloud credentials from the target cluster
******/
describe('Cloud Credential', { tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const doCreatedCloudCredsIds = [];
  const azCreatedCloudCredsIds = [];

  before(() => {
    cy.login();
    // Clean up any orphaned Amazon cloud credentials from previous test runs to ensure tests start with a clean state
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.amazonec2credentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id, false);
          } else {
            cy.log('There are no existing amazon cloud credentials to delete');
          }
        });
      }
    });
  });

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo(); // this is needed to ensure we have a valid authentication session
  });

  it('Ensure we validate credentials and show an error when invalid', () => {
    // We're doing this odd page navigation and input verification to ensure we don't run into a very specific error which required this order of events described in https://github.com/rancher/dashboard/issues/13802
    const name = 'name';
    const access = 'access';
    const secret = 'secret';
    const errorMessage = 'Authentication test failed, please check your credentials';

    const cloudCredentialsPage = new CloudCredentialsPagePo();

    cloudCredentialsPage.goTo();
    cloudCredentialsPage.waitForPage();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().waitForPage('type=aws');
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(access);
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(secret);
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(name);

    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().value()
      .should('eq', name);

    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .click();
    // In the previous bug this text would get truncated to the first letter
    cloudCredentialsPage.resourceDetail().createEditView().errorBanner().should('contain.text', errorMessage);
  });

  it('Ensure we validate credentials and show an error when invalid when creating a credential from the create cluster page', () => {
    // We're doing this odd page navigation and input verification to ensure we don't run into a very specific error which required this order of events described in https://github.com/rancher/dashboard/issues/13802
    const name = 'name';
    const access = 'access';
    const secret = 'secret';
    const errorMessage = 'Authentication test failed, please check your credentials';

    const clusterCreate = new ClusterManagerCreatePagePo();
    const loadingPo = new LoadingPo('.loading-indicator');

    clusterCreate.goTo();
    clusterCreate.waitForPage();
    clusterCreate.selectCreate(0);
    loadingPo.checkNotExists();
    clusterCreate.rke2PageTitle().should('include', 'Create Amazon EC2');
    clusterCreate.waitForPage('type=amazonec2&rkeType=rke2');

    const cloudCredentialsPage = new CloudCredentialsPagePo();

    cloudCredentialsPage.createEditCloudCreds().accessKey().set(access);
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(secret);
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(name);

    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().value()
      .should('eq', name);

    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .click();
    // In the previous bug this text would get truncated to the first letter
    cloudCredentialsPage.resourceDetail().createEditView().errorBanner().should('contain.text', errorMessage);
  });

  it('Editing a cluster cloud credential should work with duplicate named cloud credentials', () => {
    const credsName = 'test-do-creds';
    const clusterName = 'test-cluster-digital-ocean';
    const machinePoolId = 'dummy-id';

    // prepare some intercepts of XHR requests needed for the correct flow
    // intercept GET of machine configs and pass a mock (Digital Ocean)
    cy.intercept('GET', `/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       machinePoolConfigResponse(clusterName, machinePoolId),
      });
    }).as('dummyMachinePoolLoad1');

    // intercept PUT of machine configs and pass a mock (Digital Ocean)
    cy.intercept('PUT', `/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {},
      });
    }).as('dummyMachinePoolSave');

    // intercept PUT of prov cluster save and get payload sent (Digital Ocean)
    cy.intercept('PUT', `/v1/provisioning.cattle.io.clusters/fleet-default/${ clusterName }`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {},
      });
    }).as('dummyProvClusterSave');

    // create some cloud credentials (2 with the same name + 1 with different name to populate cloud credential selection dropdown)
    const cloudCredsToCreate = [
      {
        name:  credsName,
        token: 'token1'
      },
      {
        name:  credsName,
        token: 'token2'
      },
      {
        name:  `another-${ credsName }`,
        token: 'token3'
      },
    ];

    const create = (cloudCredsToCreate) => {
      return cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayloadDO(
        cloudCredsToCreate.name,
        cloudCredsToCreate.token
      ))).then((resp: Cypress.Response<any>) => {
        doCreatedCloudCredsIds.push(resp.body.id);
      });
    };

    create(cloudCredsToCreate[0])
      .then(() => create(cloudCredsToCreate[1]))
      .then(() => create(cloudCredsToCreate[2]))
      .then(() => {
        clusterList.goTo();
        cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', (req) => {
          req.reply({
            statusCode: 200,
            body:       clusterProvDigitalOceanSingleResponse(clusterName, doCreatedCloudCredsIds[doCreatedCloudCredsIds.length - 1], machinePoolId),
          });
        }).as('dummyClusterListLoad');

        clusterList.checkIsCurrentPage();
        clusterList.editCluster(clusterName);

        const editClusterPage = new ClusterManagerEditGenericPagePo(undefined, clusterName);

        editClusterPage.selectOptionForCloudCredentialWithLabel(`${ credsName } (${ doCreatedCloudCredsIds[1] })`);
        editClusterPage.save();

        cy.wait('@dummyProvClusterSave').then(({ request }) => {
          expect(request.body.spec.cloudCredentialSecretName).to.equal(doCreatedCloudCredsIds[1]);
        });
      });
  });

  it('Changing credential environment should change the list of locations when creating an Azure cluster', () => {
    const clusterName = 'test-cluster-azure';
    const machinePoolId = 'dummy-id';

    const createRKE2AzureClusterPage = new ClusterManagerCreateRke2AzurePagePo();

    // intercept GET of machine configs and pass a mock (Azure)
    cy.intercept('GET', `/v1/rke-machine-config.cattle.io.azureconfigs/fleet-default/*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       machinePoolConfigResponse(clusterName, machinePoolId),
      });
    }).as('dummyMachinePoolLoad1');

    // create some cloud credentials with different environments
    const cloudCredsToCreate = [
      {
        name:           'publicCloud',
        environment:    'AzurePublicCloud',
        subscriptionId: 'testSubscription',
        clientId:       'testClientId',
        clientSecret:   'testClientSecret',
        body:           [
          {
            name:        'public',
            displayName: 'public'
          }
        ]
      },
      {
        name:           'chinaCloud',
        environment:    'AzureChinaCloud',
        subscriptionId: 'testSubscription',
        clientId:       'testClientId',
        clientSecret:   'testClientSecret',
        body:           [
          {
            name:        'china',
            displayName: 'china'
          }
        ]
      },
      {
        name:           'USGovernment',
        environment:    'AzureUSGovernmentCloud',
        subscriptionId: 'testSubscription',
        clientId:       'testClientId',
        clientSecret:   'testClientSecret',
        body:           [
          {
            name:        'USGovernment',
            displayName: 'USGovernment'
          }
        ]
      },
    ];

    cy.intercept('GET', `/meta/aksVMSizesV2*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       [{
          Name:                           'Standard_B2pls_v2',
          AcceleratedNetworkingSupported: true,
          AvailabilityZones:              []
        }],
      });
    }).as('aksVMSizesV2Load');

    clusterList.goTo();
    clusterList.waitForPage();

    const create = (cloudCredsToCreate) => {
      return cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayloadAzure(
        cloudCredsToCreate.name,
        cloudCredsToCreate.environment,
        cloudCredsToCreate.subscriptionId,
        cloudCredsToCreate.clientId,
        cloudCredsToCreate.clientSecret,
      ))).then((resp: Cypress.Response<any>) => {
        azCreatedCloudCredsIds.push(resp.body.id);
      });
    };

    create(cloudCredsToCreate[0])
      .then(() => create(cloudCredsToCreate[1]))
      .then(() => create(cloudCredsToCreate[2]))
      .then(() => {
        clusterList.goTo();

        cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(azCreatedCloudCredsIds[0]) }`, (req) => {
          req.reply({
            statusCode: 200,
            body:       cloudCredsToCreate[0].body,
          });
        });
        cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(azCreatedCloudCredsIds[1]) }`, (req) => {
          req.reply({
            statusCode: 200,
            body:       cloudCredsToCreate[1].body,
          });
        });
        cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(azCreatedCloudCredsIds[2]) }`, (req) => {
          req.reply({
            statusCode: 200,
            body:       cloudCredsToCreate[2].body,
          });
        });

        clusterList.checkIsCurrentPage();
        clusterList.createCluster();
        createRKE2AzureClusterPage.selectCreate(1);
        createRKE2AzureClusterPage.rke2PageTitle().should('include', 'Create Azure');
        createRKE2AzureClusterPage.waitForPage('type=azure&rkeType=rke2');
        createRKE2AzureClusterPage.selectOptionForCloudCredentialWithLabel(`${ cloudCredsToCreate[0].name }`);

        createRKE2AzureClusterPage.machinePoolTab().location().checkOptionSelected(cloudCredsToCreate[0].body[0].name);
        createRKE2AzureClusterPage.machinePoolTab().environment().should('have.text', cloudCredsToCreate[0].environment );

        createRKE2AzureClusterPage.selectOptionForCloudCredentialWithLabel(`${ cloudCredsToCreate[1].name }`);

        createRKE2AzureClusterPage.machinePoolTab().environment().should('have.text', cloudCredsToCreate[1].environment );
        createRKE2AzureClusterPage.machinePoolTab().location().checkOptionSelected(cloudCredsToCreate[1].body[0].name );

        createRKE2AzureClusterPage.selectOptionForCloudCredentialWithLabel(`${ cloudCredsToCreate[2].name }`);

        createRKE2AzureClusterPage.machinePoolTab().environment().should('have.text', cloudCredsToCreate[2].environment );
        createRKE2AzureClusterPage.machinePoolTab().location().checkOptionSelected(cloudCredsToCreate[2].body[0].name );
      });
  });

  after(() => {
    for (let i = 0; i < doCreatedCloudCredsIds.length; i++) {
      cy.deleteRancherResource('v3', `cloudcredentials`, doCreatedCloudCredsIds[i]);
    }

    for (let i = 0; i < azCreatedCloudCredsIds.length; i++) {
      cy.deleteRancherResource('v3', `cloudcredentials`, azCreatedCloudCredsIds[i]);
    }
  });
});

describe('Visual Testing', { tags: ['@percy', '@manager', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    // Set theme to light
    cy.setUserPreference({ theme: 'ui-light' });
    HomePagePo.goTo(); // this is needed to ensure we have a valid authentication session
  });

  it('should display empty cloud credential creation page', () => {
    const cloudCredentialsPage = new CloudCredentialsPagePo();

    cloudCredentialsPage.goTo();
    cloudCredentialsPage.waitForPage();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().waitForPage('type=aws');

    // hide cloud credential elements before taking percy snapshot
    cy.hideElementBySelector('[data-testid="nav_header_showUserMenu"]', '[data-testid="type-count"]', '[data-testid="nav_header_showUserMenu"]', '.clusters');
    // takes percy snapshot.
    cy.percySnapshot('empty cloud credential creation page');
  });
});
