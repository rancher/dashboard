import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';
import WorkloadPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';

const podName = 'some-pod-name';

describe('Workloads', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('creating a simple pod should appear on the workloads list page', () => {
    // create a new "simple" Pod (without deployments, replicaSets, Pv's, etc)
    const workloadsPodPage = new WorkloadsPodsListPagePo('local');

    workloadsPodPage.goTo();

    const createPodPo = new PodPo();

    createPodBlueprint.metadata.name = podName;
    createPodPo.createPodViaKubectl(createPodBlueprint);

    // check if Pod is in the Workloads list
    const workload = new WorkloadPagePo('local');

    // Simple test to assert we haven't broken Workloads detail page
    // https://github.com/rancher/dashboard/issues/10490
    workload.goTo();
    workload.goToDetailsPage(podName);

    workload.mastheadTitle().should('contain', podName);
  });
  it('Validation errors should not be shown when form is just opened', () => {
    const workload = new WorkloadPagePo('local');

    workload.goTo();
    workload.clickCreate();
    workload.createWorkloadsForm().errorBanner().should('not.exist');
  });
});
