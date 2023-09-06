import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBlueprint, clonePodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Worklaods', () => {
    describe('Pods', () => {
      const workloadsPodPage = new WorkloadsPodsListPagePo('local');

      describe('Should open a terminal', { tags: ['@adminUser', '@standardUser'] }, () => {
        beforeEach(() => {
          workloadsPodPage.goTo();
        });

        it('should open a pod shell', () => {
          const shellPodPo = new PodPo();

          shellPodPo.openPodShell();
        });
      });

      describe('When cloning a pod', { tags: ['@adminUser'] }, () => {
        const { name: origPodName, namespace } = createPodBlueprint.metadata;
        const { name: clonePodName } = clonePodBlueprint.metadata;

        beforeEach(() => {
          cy.intercept('GET', `/v1/pods/${ namespace }/${ origPodName }?exclude=metadata.managedFields`).as('origPod');
          cy.intercept('GET', `/v1/pods/${ namespace }/${ clonePodName }?exclude=metadata.managedFields`).as('clonedPod');

          workloadsPodPage.goTo();

          const createPodPo = new PodPo();

          createPodPo.createPodViaKubectl(createPodBlueprint);
        });

        it(`Should have same spec as the original pod`, () => {
          const cloneCreatePodPage = new WorkLoadsPodDetailsPagePo(origPodName, { mode: 'clone' });

          cloneCreatePodPage.goTo().wait(10000);

          let origPodSpec: any;

          cy.wait('@origPod')
            .then(({ response }) => {
              expect(response?.statusCode).to.eq(200);
              origPodSpec = response?.body.spec;
              expect(origPodSpec.containers[0].resources).to.deep.eq(createPodBlueprint.spec.containers[0].resources);
            });

          const createClonePo = new PodPo();

          // Each pod need a unique name
          createClonePo.nameNsDescription().name().set(clonePodName);
          createClonePo.save().wait(10000);

          const clonedPodPage = new WorkLoadsPodDetailsPagePo(clonePodName);

          clonedPodPage.goTo().wait(10000);

          cy.wait('@clonedPod')
            .then(({ response }) => {
              expect(response?.statusCode).to.eq(200);

              const clonedSpec = response?.body?.spec;

              // In Dashboard adds empty affinity object by default
              // Remove this to compare
              if (!Object.keys(clonedSpec.affinity).length) {
                delete clonedSpec.affinity;
              }

              expect(clonedSpec).to.deep.eq(origPodSpec);
              expect(clonedSpec.containers[0].resources).to.deep.eq(createPodBlueprint.spec.containers[0].resources);
            });
        });
      });
    });
  });
});
