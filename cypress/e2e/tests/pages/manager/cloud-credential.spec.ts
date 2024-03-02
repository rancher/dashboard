import { cloudCredentialCreatePayload } from '@/cypress/e2e/blueprints/manager/cloud-credential-create-payload';
import { clusterProvDigitalOceanSingleResponse } from '@/cypress/e2e/blueprints/manager/digital-ocean-cluster-provisioning-response';
import { machinePoolConfigResponse } from '@/cypress/e2e/blueprints/manager/machine-pool-config-response';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';

describe('Cloud Credential', () => {
  const clusterList = new ClusterManagerListPagePo();

  before(() => {
    cy.login();

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
      cy.createRancherResource('v3', 'cloudcredentials', JSON.stringify(cloudCredentialCreatePayload(cloudCredsToCreate[i].name, cloudCredsToCreate[i].token))).then((resp: Cypress.Response<any>) => {
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
});
