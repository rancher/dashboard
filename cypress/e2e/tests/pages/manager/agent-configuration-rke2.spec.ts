/* eslint-disable cypress/no-unnecessary-waiting */
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import {
  podAffinityData,
  requestAndLimitsData,
  tolerationsData,
  nodeAffinityData
} from '@/cypress/e2e/blueprints/agent-configuration/agent-configuration-rke2-data';
import { payloadComparisonData } from '@/cypress/e2e/blueprints/agent-configuration/agent-configuration-rke2-payload';

describe.skip('[Vue3 Skip]: Agent Configuration for RKE2', { tags: ['@manager', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('Should send the correct payload to the server', () => {
    const createCustomClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    createCustomClusterPage.goToCustomClusterCreation('_');
    createCustomClusterPage.waitForPage();

    // intercept
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('customRKE2ClusterCreation');

    // we should be on the custom cluster creation screen (starts on cluster agent tab as per url of goTo)
    createCustomClusterPage.title().should('contain', 'Create Custom');

    // cluster name
    createCustomClusterPage.nameNsDescription().name().set(`test-cluster-${ Math.random().toString(36).substr(2, 6) }`);

    // navigate to the cluster agent area
    createCustomClusterPage.agentConfiguration().clickTab('#clusteragentconfig');

    // fill requests and limits form (cluster agent)
    createCustomClusterPage.agentConfiguration().fillRequestandLimitsForm('cluster', requestAndLimitsData);

    // fill tolerations form (cluster agent)
    createCustomClusterPage.agentConfiguration().fillTolerationsForm('cluster', tolerationsData);

    // Select custom affinity rules (cluster agent)
    createCustomClusterPage.agentConfiguration().selectAffinityOption('cluster', 1);

    // Clear out any prefilled affinity rules so that we start from scratch
    createCustomClusterPage.agentConfiguration().clearOutPrefilledAffinityRules('cluster', 'pod');
    createCustomClusterPage.agentConfiguration().clearOutPrefilledAffinityRules('cluster', 'node');

    // fill form for pod affinity/anti-affinity (cluster agent)
    createCustomClusterPage.agentConfiguration().fillPodSelectorForm('cluster', podAffinityData);

    // fill form for pod affinity/anti-affinity (cluster agent)
    createCustomClusterPage.agentConfiguration().fillNodeSelectorForm('cluster', nodeAffinityData);

    // navigate to the fleet agent area
    createCustomClusterPage.agentConfiguration().clickTab('#fleetagentconfig');

    // fill requests and limits form (fleet agent)
    createCustomClusterPage.agentConfiguration().fillRequestandLimitsForm('fleet', requestAndLimitsData);

    // fill tolerations form (fleet agent)
    createCustomClusterPage.agentConfiguration().fillTolerationsForm('fleet', tolerationsData);

    // Select custom affinity rules (fleet agent)
    createCustomClusterPage.agentConfiguration().selectAffinityOption('fleet', 1);

    // Clear out any prefilled affinity rules so that we start from scratch
    createCustomClusterPage.agentConfiguration().clearOutPrefilledAffinityRules('fleet', 'pod');
    createCustomClusterPage.agentConfiguration().clearOutPrefilledAffinityRules('fleet', 'node');

    // fill form for pod affinity/anti-affinity (fleet agent)
    createCustomClusterPage.agentConfiguration().fillPodSelectorForm('fleet', podAffinityData);

    // fill form for pod affinity/anti-affinity (fleet agent)
    createCustomClusterPage.agentConfiguration().fillNodeSelectorForm('fleet', nodeAffinityData);

    // hit create button
    cy.get('[data-testid="rke2-custom-create-save"]').click();

    // need to do a wait to make sure intercept doesn't fail on cy.wait for request
    // ci/cd pipelines are notoriously slow... let's wait longer than usual
    cy.wait('@customRKE2ClusterCreation', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      expect(req.request?.body?.spec.clusterAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization);
      expect(req.request?.body?.spec.fleetAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization);
    });
  });
});
