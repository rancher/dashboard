import { cloudCredentialCreatePayloadDO, cloudCredentialCreatePayloadAzure } from '@/cypress/e2e/blueprints/manager/cloud-credential-create-payload';
import { clusterProvDigitalOceanSingleResponse } from '@/cypress/e2e/blueprints/manager/digital-ocean-cluster-provisioning-response';
import { machinePoolConfigResponse } from '@/cypress/e2e/blueprints/manager/machine-pool-config-response';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import CloudCredentialsCreatePagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials-create.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import CloudCredentialsCreateAWSPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials-create-aws.po';

describe('Cloud Credential', { testIsolation: 'off' }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const doCreatedCloudCredsIds = [];
  const azCreatedCloudCredsIds = [];

  before(() => {
    cy.login();
  });

  it('Editing a cluster cloud credential should work with duplicate named cloud credentials', { tags: ['@manager', '@adminUser'] }, () => {
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

        cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?exclude=metadata.managedFields', (req) => {
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

  it('Changing credential environment should change the list of locations when creating an Azure cluster', { tags: ['@manager', '@adminUser'] }, () => {
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

    ClusterManagerListPagePo.navTo();
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
        createRKE2AzureClusterPage.rkeToggle().set('RKE2/K3s');
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

  it('Ensure we validate credentials and show an error when invalid', { tags: ['@manager', '@adminUser'] }, () => {
    // We're doing this odd page navigation and input verification to ensure we don't run into a very specific error which required this order of events described in https://github.com/rancher/dashboard/issues/13802
    const name = 'name';
    const access = 'access';
    const secret = 'secret';
    const errorMessage = 'Authentication test failed, please check your credentials';

    CloudCredentialsCreatePagePo.goTo();
    const createCredentialsPo = new CloudCredentialsCreatePagePo();

    createCredentialsPo.waitForPageWithExactUrl();

    const createCredentialsAwsPo = createCredentialsPo.selectAws();

    createCredentialsAwsPo.waitForPageWithExactUrl();

    createCredentialsAwsPo.accessKeyInput().set(access);
    createCredentialsAwsPo.secretKeyInput().set(secret);
    createCredentialsAwsPo.credentialNameInput().set(name);

    createCredentialsAwsPo.credentialNameInput().value().should('eq', name);

    createCredentialsAwsPo.clickCreate();
    // In the previous bug this text would get truncated to the first letter
    createCredentialsAwsPo.errorBanner().should('contain.text', errorMessage);
  });

  it('Ensure we validate credentials and show an error when invalid when creating a credential from the create cluster page', { tags: ['@manager', '@adminUser'] }, () => {
    // We're doing this odd page navigation and input verification to ensure we don't run into a very specific error which required this order of events described in https://github.com/rancher/dashboard/issues/13802
    const name = 'name';
    const access = 'access';
    const secret = 'secret';
    const errorMessage = 'Authentication test failed, please check your credentials';

    const clusterCreate = new ClusterManagerCreatePagePo();

    clusterCreate.goTo();
    clusterCreate.waitForPage();
    clusterCreate.selectCreate(0);
    clusterCreate.rke2PageTitle().should('include', 'Create Amazon EC2');

    const createCredentialsAwsPo = new CloudCredentialsCreateAWSPagePo();

    createCredentialsAwsPo.accessKeyInput().set(access);
    createCredentialsAwsPo.secretKeyInput().set(secret);
    createCredentialsAwsPo.credentialNameInput().set(name);

    createCredentialsAwsPo.credentialNameInput().value().should('eq', name);

    createCredentialsAwsPo.clickCreate();
    // In the previous bug this text would get truncated to the first letter
    createCredentialsAwsPo.errorBanner().should('contain.text', errorMessage);
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
