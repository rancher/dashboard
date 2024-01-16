import ClusterManagerCreateRke1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import ClusterManagerEditRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke1-custom.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

import { payloadComparisonData, payloadEditComparisonData } from '~/cypress/e2e/blueprints/agent-configuration/agent-configuration-payload';
import {
  tolerationsData,
  nodeAffinityData,
  podAffinityData,
  requestAndLimitsEditData,
  tolerationsEditData
} from '~/cypress/e2e/blueprints/agent-configuration/agent-configuration-rke1-data';
import { requestAndLimitsData } from '@/cypress/e2e/blueprints/agent-configuration/agent-configuration-rke2-data';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

// File specific consts
const clusterNamePartial = `${ runPrefix }-create`;

describe('rke1 agent configuration', { tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo('local');
  const createClusterPage = new ClusterManagerCreateRke1PagePo();
  let clusterId = '';

  const generateClusterName = (suffix: string) => {
    return `${ clusterNamePartial }-${ suffix }`;
  };

  beforeEach(() => {
    cy.login();
  });

  describe('rke1 agent configuration requests and limits', () => {
    const clusterName = generateClusterName('requests-limits');

    after(() => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.list().actionMenu(clusterName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.confirm(clusterName);
      promptRemove.remove();
    });

    it('can create a custom cluster with fleet and cluster agent requests and limits defined', () => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      createClusterPage.waitForPage();
      createClusterPage.rkeToggle().unCheck();
      createClusterPage.selectCustom(0);

      createClusterPage.clusterName().set(clusterName);

      createClusterPage.clusterAgentAccordion().expand();
      createClusterPage.fleetAgentAccordion().expand();

      const clusterAgentConfigPo = createClusterPage.clusterAgentConfiguration();
      const fleetAgentConfigPo = createClusterPage.fleetAgentConfiguration();

      clusterAgentConfigPo.cpuRequests().set(requestAndLimitsData.request.cpu.toString());
      clusterAgentConfigPo.cpuLimits().set(requestAndLimitsData.limit.cpu.toString());
      clusterAgentConfigPo.memoryRequests().set(requestAndLimitsData.request.memory.toString());
      clusterAgentConfigPo.memoryLimits().set(requestAndLimitsData.limit.memory.toString());

      fleetAgentConfigPo.cpuRequests().set(requestAndLimitsData.request.cpu.toString());
      fleetAgentConfigPo.cpuLimits().set(requestAndLimitsData.limit.cpu.toString());
      fleetAgentConfigPo.memoryRequests().set(requestAndLimitsData.request.memory.toString());
      fleetAgentConfigPo.memoryLimits().set(requestAndLimitsData.limit.memory.toString());

      cy.intercept('POST', '/v3/cluster?_replace=true').as('rke1CustomClusterCreation');

      createClusterPage.next();

      cy.wait('@rke1CustomClusterCreation', { requestTimeout: 10000 }).then((req) => {
        expect(req?.response?.statusCode).to.equal(201);
        clusterId = req?.response?.body?.id;

        expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.overrideResourceRequirements);

        expect(req.request?.body?.fleetAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.overrideResourceRequirements);
      });
    });

    it('can edit a custom cluster to update agent requests and limits', () => {
      const editClusterPage = new ClusterManagerEditRke1CustomPagePo(clusterId);

      clusterList.goTo();
      clusterList.checkIsCurrentPage();

      clusterList.list().actionMenu(clusterName).getMenuItem('Edit Config').click();
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

      cy.intercept('PUT', `/v3/clusters/${ clusterId }?_replace=true`).as('rke2CustomClusterEdit');

      editClusterPage.next();

      cy.wait('@rke2CustomClusterEdit', { requestTimeout: 10000 }).then((req) => {
        expect(req?.response?.statusCode).to.equal(200);
        expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideResourceRequirements).to.deep.equal(payloadEditComparisonData.clusterAgentDeploymentCustomization.overrideResourceRequirements);
      });
    });
  });

  describe('rke1 agent configuration tolerations', () => {
    const clusterName = generateClusterName('tolerations');

    after(() => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.list().actionMenu(clusterName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.confirm(clusterName);
      promptRemove.remove();
    });

    it('can create a custom cluster with fleet and cluster agent tolerations defined', () => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      createClusterPage.waitForPage();
      createClusterPage.rkeToggle().unCheck();
      createClusterPage.selectCustom(0);

      createClusterPage.clusterName().set(clusterName);

      createClusterPage.clusterAgentAccordion().expand();
      createClusterPage.fleetAgentAccordion().expand();

      const clusterAgentConfigPo = createClusterPage.clusterAgentConfiguration();
      const fleetAgentConfigPo = createClusterPage.fleetAgentConfiguration();

      tolerationsData.forEach((toleration, idx) => {
        clusterAgentConfigPo.tolerations().addRow();
        clusterAgentConfigPo.tolerations().editToleration(toleration, idx);
      });

      tolerationsData.forEach((toleration, idx) => {
        fleetAgentConfigPo.tolerations().addRow();
        fleetAgentConfigPo.tolerations().editToleration(toleration, idx);
      });

      cy.intercept('POST', '/v3/cluster?_replace=true').as('rke1CustomClusterCreation');

      createClusterPage.next();

      cy.wait('@rke1CustomClusterCreation', { requestTimeout: 10000 }).then((req) => {
        expect(req?.response?.statusCode).to.equal(201);
        clusterId = req?.response?.body?.id;

        expect(req.request?.body?.clusterAgentDeploymentCustomization.appendTolerations).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.appendTolerations);

        expect(req.request?.body?.fleetAgentDeploymentCustomization.appendTolerations).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.appendTolerations);
      });
    });

    it('can edit a custom cluster to update agent tolerations', () => {
      const editClusterPage = new ClusterManagerEditRke1CustomPagePo(clusterId);

      clusterList.goTo();
      clusterList.checkIsCurrentPage();

      clusterList.list().actionMenu(clusterName).getMenuItem('Edit Config').click();
      editClusterPage.waitForPage('mode=edit');

      editClusterPage.clusterAgentAccordion().expand();

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
      });
    });
  });

  describe('rke1 agent configuration affinity', () => {
    const clusterName = generateClusterName('tolerations');

    after(() => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.list().actionMenu(clusterName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.confirm(clusterName);
      promptRemove.remove();
    });

    it('can create a custom cluster with fleet and cluster agent affinity defined', () => {
      clusterList.goTo();
      clusterList.checkIsCurrentPage();
      clusterList.createCluster();

      createClusterPage.waitForPage();
      createClusterPage.rkeToggle().unCheck();
      createClusterPage.selectCustom(0);

      createClusterPage.clusterName().set(clusterName);

      createClusterPage.clusterAgentAccordion().expand();
      createClusterPage.fleetAgentAccordion().expand();

      const clusterAgentConfigPo = createClusterPage.clusterAgentConfiguration();
      const fleetAgentConfigPo = createClusterPage.fleetAgentConfiguration();

      clusterAgentConfigPo.affinityRadio().clickLabel('Customize affinity rules');
      clusterAgentConfigPo.nodeAffinity().removeAllTerms();

      nodeAffinityData.forEach((nodeSelectorTermData, i) => {
        clusterAgentConfigPo.nodeAffinity().addTerm();
        clusterAgentConfigPo.nodeAffinity().editTerm(nodeSelectorTermData, i);
      });

      clusterAgentConfigPo.podAffinity().removeAllTerms();

      podAffinityData.forEach((podAffinityTermData, i) => {
        clusterAgentConfigPo.podAffinity().addTerm();
        clusterAgentConfigPo.podAffinity().editTerm(podAffinityTermData, i);
      });

      fleetAgentConfigPo.affinityRadio().clickLabel('Customize affinity rules');
      fleetAgentConfigPo.nodeAffinity().removeAllTerms();

      nodeAffinityData.forEach((nodeSelectorTermData, i) => {
        fleetAgentConfigPo.nodeAffinity().addTerm();
        fleetAgentConfigPo.nodeAffinity().editTerm(nodeSelectorTermData, i);
      });

      fleetAgentConfigPo.podAffinity().removeAllTerms();

      podAffinityData.forEach((podAffinityTermData, i) => {
        fleetAgentConfigPo.podAffinity().addTerm();
        fleetAgentConfigPo.podAffinity().editTerm(podAffinityTermData, i);
      });

      cy.intercept('POST', '/v3/cluster?_replace=true').as('rke1CustomClusterCreation');

      createClusterPage.next();

      cy.wait('@rke1CustomClusterCreation', { requestTimeout: 10000 }).then((req) => {
        expect(req?.response?.statusCode).to.equal(201);
        clusterId = req?.response?.body?.id;

        expect(req.request?.body?.clusterAgentDeploymentCustomization.overrideAffinity).to.deep.equal(payloadComparisonData.clusterAgentDeploymentCustomization.overrideAffinity);

        expect(req.request?.body?.fleetAgentDeploymentCustomization.overrideAffinity).to.deep.equal(payloadComparisonData.fleetAgentDeploymentCustomization.overrideAffinity);
      });
    });
  });
});
