import { cloudCredentialCreatePayloadDO, cloudCredentialCreatePayloadAzure } from '@/cypress/e2e/blueprints/manager/cloud-credential-create-payload';
import { clusterProvDigitalOceanSingleResponse } from '@/cypress/e2e/blueprints/manager/digital-ocean-cluster-provisioning-response';
import { machinePoolConfigResponse } from '@/cypress/e2e/blueprints/manager/machine-pool-config-response';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';

describe('Cloud Credential', { testIsolation: 'off' }, () => {
  const clusterList = new ClusterManagerListPagePo();

  before(() => {
    cy.login();
    cy.getRancherResource('v3', 'cloudCredentials').then((resp: Cypress.Response<any>) => {
      const credentials = resp.body.data;

      credentials.forEach( (credential) => {
        cy.deleteRancherResource('v3', 'cloudCredentials', credential.id.trim(), false);
      });
    });
  });

  beforeEach(() => {
    clusterList.goTo();
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

    const createdCloudCredsIds = [];

    for (let i = 0; i < cloudCredsToCreate.length; i++) {
      cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayloadDO(cloudCredsToCreate[i].name, cloudCredsToCreate[i].token))).then((resp: Cypress.Response<any>) => {
        createdCloudCredsIds.push(resp.body.id);

        if (i === 0) {
          // intercept GET of list of prov clusters and pass a mock (Digital Ocean)
          cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?exclude=metadata.managedFields', (req) => {
            req.reply({
              statusCode: 200,
              body:       clusterProvDigitalOceanSingleResponse(clusterName, resp.body.id, machinePoolId),
            });
          }).as('dummyClusterListLoad');
        }

        // code to edit cluster and final checks needs to be after all "then's" otherwise the cloud cred id's aren't stored yet on it's variable...
        if (i === cloudCredsToCreate.length - 1) {
          clusterList.checkIsCurrentPage();
          clusterList.editCluster(clusterName);

          const editClusterPage = new ClusterManagerEditGenericPagePo(undefined, clusterName);

          editClusterPage.selectOptionForCloudCredentialWithLabel(`${ credsName } (${ createdCloudCredsIds[1] })`);
          editClusterPage.save();

          cy.wait('@dummyProvClusterSave').then(({ request }) => {
            expect(request.body.spec.cloudCredentialSecretName).to.equal(createdCloudCredsIds[1]);
          });
        }
      });
    }
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

    const createdCloudCredsIds = [];

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    for (let i = 0; i < cloudCredsToCreate.length; i++) {
      cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayloadAzure(
        cloudCredsToCreate[i].name,
        cloudCredsToCreate[i].environment,
        cloudCredsToCreate[i].subscriptionId,
        cloudCredsToCreate[i].clientId,
        cloudCredsToCreate[i].clientSecret,
      ))).then((resp: Cypress.Response<any>) => {
        createdCloudCredsIds.push(resp.body.id);

        if (i === cloudCredsToCreate.length - 1) {
          cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(createdCloudCredsIds[0]) }`, (req) => {
            req.reply({
              statusCode: 200,
              body:       cloudCredsToCreate[0].body,
            });
          }).as('aksLocations0');
          cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(createdCloudCredsIds[1]) }`, (req) => {
            req.reply({
              statusCode: 200,
              body:       cloudCredsToCreate[1].body,
            });
          }).as('aksLocations1');
          cy.intercept('GET', `/meta/aksLocations?cloudCredentialId=${ encodeURIComponent(createdCloudCredsIds[2]) }`, (req) => {
            req.reply({
              statusCode: 200,
              body:       cloudCredsToCreate[2].body,
            });
          }).as('aksLocations2');

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
        }
      });
    }
  });
});
