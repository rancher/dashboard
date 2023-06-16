import ClusterManagerCreateRke1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import { requestAndLimitsData } from '@/cypress/e2e/tests/pages/data/agent-configuration-rke2-data';
import { tolerationsData, nodeAffinityData, podAffinityData } from '@/cypress/e2e/tests/pages/data/agent-configuration-rke1-data';
import { NodeSelectorTermPo } from '@/cypress/e2e/po/components/embedded-ember/ember-node-affinity.po';
import EmberAgentConfigurationPo from '~/cypress/e2e/po/components/embedded-ember/ember-agent-configuration.po';
import { payloadComparisonData } from '@/cypress/e2e/tests/pages/data/agent-configuration-rke2-payload';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const { baseUrl } = Cypress.config();
// const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;

describe('rke1-provisioning', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('RKE1 Custom cluster', () => {
    const createClusterPage = new ClusterManagerCreateRke1PagePo();

    it('can create a new cluster', () => {
      createClusterPage.goTo();

      createClusterPage.waitForPage();
      createClusterPage.rkeToggle().unCheck();
      createClusterPage.selectCustom(0);

      createClusterPage.name().set(rke1CustomName);

      const setAgentConfig = (agentConfigPo: EmberAgentConfigurationPo) => {
        // set requests/limits data
        // agentConfigPo.cpuRequests().set(requestAndLimitsData.request.cpu.toString());
        // agentConfigPo.cpuLimits().set(requestAndLimitsData.limit.cpu.toString());
        // agentConfigPo.memoryRequests().set(requestAndLimitsData.request.memory.toString());
        // agentConfigPo.memoryLimits().set(requestAndLimitsData.limit.memory.toString());

        // // set tolerations data
        // tolerationsData.forEach((toleration, idx) => {
        //   agentConfigPo.tolerations().addRow();
        //   agentConfigPo.tolerations().editToleration(toleration, idx);
        // });

        // flip affinity radio
        agentConfigPo.affinityRadio().clickLabel('Customize affinity rules');
        // // remove node affinity defaults
        // agentConfigPo.nodeAffinity().removeAllTerms();

        // nodeAffinityData.forEach((nodeSelectorTermData, i) => {
        //   agentConfigPo.nodeAffinity().addTerm();
        //   agentConfigPo.nodeAffinity().editTerm(nodeSelectorTermData, i);
        // });

        // remove pod affinity defaults
        agentConfigPo.podAffinity().removeAllTerms();

        podAffinityData.forEach((podAffinityTermData, i) => {
          agentConfigPo.podAffinity().addTerm();
          agentConfigPo.podAffinity().editTerm(podAffinityTermData, i);
        });
      };

      createClusterPage.clusterAgentAccordion().expand();

      setAgentConfig(createClusterPage.clusterAgentConfiguration());

      createClusterPage.fleetAgentAccordion().expand();

      setAgentConfig(createClusterPage.fleetAgentConfiguration());

      cy.intercept('POST', '/v3/cluster?_replace=true').as('rke1CustomClusterCreation');

      createClusterPage.next();

      cy.wait('@rke1CustomClusterCreation', { requestTimeout: 10000 }).then((req) => {
        expect(req.response?.statusCode).to.equal(201);
        console.log('e2e req', req);
        // expect(req.request?.body?.clusterAgentDeploymentCustomization.appendTolerations).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.appendTolerations);
        // expect(req.request?.body?.fleetAgentDeploymentCustomization.appendTolerations).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.appendTolerations);
        // expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideAffinity.nodeAffinity).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.overrideAffinity.nodeAffinity);
        // expect(req.request?.body?.fleetAgentDeploymentCustomization.overrideAffinity.nodeAffinity).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.overrideAffinity.nodeAffinity);
                expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideAffinity.podAffinity).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.overrideAffinity.podAffinity);
        expect(req.request?.body?.fleetAgentDeploymentCustomization.overrideAffinity.podAffinity).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.overrideAffinity.podAffinity);
        // expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.overrideResourceRequirements);
        // expect(req.request?.body?.fleetAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.overrideResourceRequirements);
        // expect(req.request?.body?.clusterAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization);
        // expect(req.request?.body?.fleetAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization);
      });
    });
  });
});
