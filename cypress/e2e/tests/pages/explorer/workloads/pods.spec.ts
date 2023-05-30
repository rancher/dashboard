import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBluerint, clonePodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Worklaods', () => {
    describe('Pods', () => {
      const workloadsPodPage = new WorkloadsPodsListPagePo('local');

      describe('When cloning a pod', () => {
        const { name: origPodName, namespace } = createPodBluerint.metadata;
        const { name: clonePodName } = clonePodBlueprint.metadata;

        let podPo: PodPo;

        beforeEach(() => {
          cy.intercept('GET', `/v1/pods/${ namespace }/${ origPodName }`).as('origPod');
          cy.intercept('GET', `/v1/pods/${ namespace }/${ clonePodName }`).as('clonedPod');

          workloadsPodPage.goTo();

          podPo = new PodPo();
          podPo.createPodViaKubectl(createPodBluerint);
        });

        it(`Should have same spec as the original pod`, () => {
          const origPodPage = new WorkLoadsPodDetailsPagePo(origPodName, { mode: 'clone' });

          origPodPage.goTo();

          let origPodSpec: any;

          cy.wait('@origPod')
            .then(({ response }) => {
              expect(response?.statusCode).to.eq(200);
              origPodSpec = response?.body.spec;
              expect(origPodSpec.containers[0].resources).to.deep.eq(createPodBluerint.spec.containers[0].resources);
            }).wait(10000);

          // Each pod need a unique name
          podPo.nameNsDescription().name().set(clonePodName);
          podPo.save().wait(10000);

          const clonedPodPage = new WorkLoadsPodDetailsPagePo(clonePodName);

          clonedPodPage.goTo();

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
              expect(clonedSpec.containers[0].resources).to.deep.eq(createPodBluerint.spec.containers[0].resources);
            });
        });
      });
    });
  });
});
