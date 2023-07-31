import ClusterManagerCreateRke1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import ClusterManagerEditRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke1-custom.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import EmberAgentConfigurationPo from '@/cypress/e2e/po/components/ember/ember-agent-configuration.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

import { payloadComparisonData, payloadEditComparisonData } from '@/cypress/e2e/tests/pages/data/agent-configuration-payload';
import {
  tolerationsData,
  nodeAffinityData,
  podAffinityData,
  requestAndLimitsEditData,
  tolerationsEditData
} from '@/cypress/e2e/tests/pages/data/agent-configuration-rke1-data';
import { requestAndLimitsData } from '@/cypress/e2e/blueprints/agent-configuration/agent-configuration-rke2-data';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const clusterNamePartial = `${ runPrefix }-create`;
const rke1CustomName = `${ clusterNamePartial }-rke1-custom`;

describe('rke1 agent configuration', { tags: ['@adminUser', '@standardUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo('local');
  const createClusterPage = new ClusterManagerCreateRke1PagePo();
  let clusterId = '';

  beforeEach(() => {
    cy.login();
  });

  after(() => {
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.list().actionMenu(rke1CustomName).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.confirm(rke1CustomName);
    promptRemove.remove();
  });

  it('can create a custom cluster with fleet and cluster agent configuration defined', () => {
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createClusterPage.waitForPage();
    createClusterPage.rkeToggle().unCheck();
    createClusterPage.selectCustom(0);

    createClusterPage.clusterName().set(rke1CustomName);

    const setAgentConfig = (agentConfigPo: EmberAgentConfigurationPo) => {
      // set requests/limits data
      agentConfigPo.cpuRequests().set(requestAndLimitsData.request.cpu.toString());
      agentConfigPo.cpuLimits().set(requestAndLimitsData.limit.cpu.toString());
      agentConfigPo.memoryRequests().set(requestAndLimitsData.request.memory.toString());
      agentConfigPo.memoryLimits().set(requestAndLimitsData.limit.memory.toString());

      // set tolerations data
      tolerationsData.forEach((toleration, idx) => {
        agentConfigPo.tolerations().addRow();
        agentConfigPo.tolerations().editToleration(toleration, idx);
      });

      // flip affinity radio
      agentConfigPo.affinityRadio().clickLabel('Customize affinity rules');
      // remove node affinity defaults
      agentConfigPo.nodeAffinity().removeAllTerms();

      nodeAffinityData.forEach((nodeSelectorTermData, i) => {
        agentConfigPo.nodeAffinity().addTerm();
        agentConfigPo.nodeAffinity().editTerm(nodeSelectorTermData, i);
      });

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
      expect(req?.response?.statusCode).to.equal(201);
      clusterId = req?.response?.body?.id;

      expect(req.request?.body?.clusterAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization);

      expect(req.request?.body?.fleetAgentDeploymentCustomization).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization);
    });
  });

  it('can edit agent configuration', () => {
    const editClusterPage = new ClusterManagerEditRke1CustomPagePo(clusterId);

    clusterList.goTo();
    clusterList.checkIsCurrentPage();

    clusterList.list().actionMenu(rke1CustomName).getMenuItem('Edit Config').click();
    editClusterPage.waitForPage('mode=edit');

    editClusterPage.clusterAgentAccordion().expand();

    editClusterPage.clusterAgentConfiguration().cpuRequests().clear();
    editClusterPage.clusterAgentConfiguration().cpuLimits().clear();
    editClusterPage.clusterAgentConfiguration().memoryRequests().clear();
    editClusterPage.clusterAgentConfiguration().memoryLimits().clear();

    editClusterPage.clusterAgentConfiguration().cpuRequests().set(requestAndLimitsEditData.request.cpu.toString());
    editClusterPage.clusterAgentConfiguration().cpuLimits().set(requestAndLimitsEditData.limit.cpu.toString());
    editClusterPage.clusterAgentConfiguration().memoryRequests().set(requestAndLimitsEditData.request.memory.toString());
    editClusterPage.clusterAgentConfiguration().memoryLimits().set(requestAndLimitsEditData.limit.memory.toString());

    editClusterPage.clusterAgentConfiguration().tolerations().removeAllRows();

    tolerationsEditData.forEach((toleration, idx) => {
      editClusterPage.clusterAgentConfiguration().tolerations().addRow();
      editClusterPage.clusterAgentConfiguration().tolerations().editToleration(toleration, idx);
    });

    cy.intercept('PUT', `/v3/clusters/${ clusterId }?_replace=true`).as('rke2CustomClusterEdit');

    editClusterPage.next();

    cy.wait('@rke2CustomClusterEdit', { requestTimeout: 10000 }).then((req) => {
      expect(req?.response?.statusCode).to.equal(200);
      expect(req.request?.body?.clusterAgentDeploymentCustomization.appendTolerations).to.deep.equal(payloadEditComparisonData.clusterAgentDeploymentCustomization.appendTolerations);
      expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadEditComparisonData.clusterAgentDeploymentCustomization.overrideResourceRequirements);
    });
  });
});
