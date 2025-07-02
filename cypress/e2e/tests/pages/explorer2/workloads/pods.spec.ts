import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo, WorkLoadsPodEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
// import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo, WorkloadsPodsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBlueprint, clonePodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';
// import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { generatePodsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/pods/pods-get';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

const localCluster = 'local';

describe('Pods', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const workloadsPodPage = new WorkloadsPodsListPagePo(localCluster);

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    let uniquePod = SortableTablePo.firstByDefaultName('pod');
    let podNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      const createPod = (podName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = podName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createPod(ns, name, SMALL_CONTAINER.image, false, { createNameOptions: { prefixContext: true } });
        };
      };

      cy.createManyNamespacedResourced({
        context:        'ns1',
        createWorkload: createPod(),
      })
        .then(({ ns, workloadNames }) => {
          podNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResourced({
          context:        'ns2',
          createWorkload: createPod(uniquePod),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          uniquePod = workloadNames[0];
          nsName2 = ns;

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
    });

    it('pagination is visible and user is able to navigate through pods data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();

      // check pods count
      const count = podNamesList.length + 1;

      cy.waitForRancherResources('v1', 'pods', count - 1, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
          });

        // navigate to next page - right button
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } Pods`);
          });
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
          });
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } Pods`);
          });

        // navigate to first page - beginning button
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
          });
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        workloadsPodPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated pods data', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();
      // use filter to only show test data
      workloadsPodPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      workloadsPodPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // pod name should be visible on first page (sorted in ASC order)
      workloadsPodPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(podNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      workloadsPodPage.list().resourceTable().sortableTable().sort(2)
        .click({ force: true });
      workloadsPodPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // pod name should be NOT visible on first page (sorted in DESC order)
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(podNamesList[0])
        .should('not.exist');

      // navigate to last page
      workloadsPodPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // pod name should be visible on last page (sorted in DESC order)
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(podNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter pods', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();

      workloadsPodPage.list().resourceTable().sortableTable().checkVisible();
      workloadsPodPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      workloadsPodPage.list().resourceTable().sortableTable().filter(podNamesList[0]);
      workloadsPodPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(podNamesList[0])
        .should('be.visible');

      // filter by namespace
      workloadsPodPage.list().resourceTable().sortableTable().filter(nsName2);
      workloadsPodPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(uniquePod)
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of pods data
      generatePodsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsPodsListPagePo.navTo();
      cy.wait('@podsDataSmall');
      workloadsPodPage.waitForPage();

      workloadsPodPage.list().resourceTable().sortableTable().checkVisible();
      workloadsPodPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.list().resourceTable().sortableTable().checkRowCount(false, 3);
      workloadsPodPage.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all pods in it)
      cy.deleteNamespace([nsName1, nsName2]);
    });
  });

  describe('Should open a terminal', () => {
    beforeEach(() => {
      workloadsPodPage.goTo();
    });

    it('should open a pod shell', () => {
      const shellPodPo = new PodPo();

      shellPodPo.openPodShell();
    });
  });

  describe('When cloning a pod', () => {
    const { name: origPodName, namespace } = createPodBlueprint.metadata;
    const { name: clonePodName } = clonePodBlueprint.metadata;

    beforeEach(() => {
      cy.intercept('GET', `/v1/pods/${ namespace }/${ origPodName }?*`).as('origPod');
      cy.intercept('GET', `/v1/pods/${ namespace }/${ clonePodName }?*`).as('clonedPod');

      workloadsPodPage.goTo();

      const createPodPo = new PodPo();

      createPodPo.createPodViaKubectl(createPodBlueprint);
    });

    it(`Should have same spec as the original pod`, () => {
      const cloneCreatePodPage = new WorkLoadsPodDetailsPagePo(origPodName, { mode: 'clone' });

      cloneCreatePodPage.goTo();

      let origPodSpec: any;

      cy.wait('@origPod', { timeout: 20000 })
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          origPodSpec = response?.body.spec;
          expect(origPodSpec.containers[0].resources).to.deep.eq(createPodBlueprint.spec.containers[0].resources);
        });

      const createClonePo = new PodPo();

      // Each pod need a unique name
      createClonePo.nameNsDescription().name().set(clonePodName);
      createClonePo.save();

      workloadsPodPage.waitForPage();
      workloadsPodPage.list().checkVisible();
      workloadsPodPage.list().resourceTable().sortableTable().filter(clonePodName);
      workloadsPodPage.list().resourceTable().sortableTable().rowWithName(clonePodName)
        .checkExists();

      // Simple test to assert we haven't broken Pods detail page
      // https://github.com/rancher/dashboard/issues/10490
      const clonedPodPage = new WorkLoadsPodDetailsPagePo(clonePodName);

      clonedPodPage.goTo();// Needs to be goTo to ensure http request is fired
      clonedPodPage.waitForPage();

      cy.wait('@clonedPod', { timeout: 20000 })
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

  describe('When creating a pod using the web Form', () => {
    const singlePodName = Cypress._.uniqueId(Date.now().toString());

    it(`should have the default input units displayed`, () => {
      workloadsPodPage.goTo();
      workloadsPodPage.createPod();

      const podDetails = new PodPo();

      podDetails.nameNsDescription().name().set(singlePodName);

      const podDetailsGeneral = podDetails.containerButton().general();

      podDetailsGeneral.inputImageName().set(SMALL_CONTAINER.image);
      const podDetailsResources = podDetails.containerButton().resources();

      podDetailsResources.clickResources();
      podDetailsResources.inputCpuLimit().getAttributeValue('placeholder').should('contain', 'e.g. 1000');
      podDetailsResources.inputCpuReservation().getAttributeValue('placeholder').should('contain', 'e.g. 1000');
      podDetailsResources.inputMemoryReservation().getAttributeValue('placeholder').should('contain', 'e.g. 128');
      podDetailsResources.inputMemoryLimit().getAttributeValue('placeholder').should('contain', 'e.g. 128');
      podDetailsResources.inputGpuLimit().getAttributeValue('placeholder').should('contain', 'e.g. 1');

      podDetailsResources.inputCpuLimit().set('100');
      podDetailsResources.inputCpuReservation().set('100');
      podDetailsResources.inputMemoryLimit().set('128');
      podDetailsResources.inputMemoryLimit().set('128');
      podDetailsResources.inputGpuLimit().set('0');

      podDetails.saveCreateForm().cruResource().saveOrCreate().click();
      workloadsPodPage.waitForPage();
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(singlePodName)
        .scrollIntoView()
        .should('be.visible');
    });

    it('Footer controls should stick to bottom in YAML Editor', () => {
      // testing https://github.com/rancher/dashboard/issues/10880
      const workloadsPodEditPage = new WorkLoadsPodEditPagePo(singlePodName);

      cy.intercept('GET', `/api/v1/namespaces/default/pods/${ singlePodName }`).as('getPod');

      workloadsPodPage.goTo();
      workloadsPodPage.waitForPage();
      workloadsPodPage.list().resourceTable().sortableTable().rowElementWithName(singlePodName)
        .scrollIntoView()
        .should('be.visible');
      workloadsPodPage.list().actionMenu(singlePodName).getMenuItem('Edit YAML').click();
      workloadsPodEditPage.waitForPage('mode=edit&as=yaml');
      cy.wait('@getPod');

      // clear the form
      workloadsPodEditPage.resourceDetail().resourceYaml().codeMirror().set('');

      // footer should maintain its position on the page
      workloadsPodEditPage.resourceDetail().resourceYaml().footer().then(($el) => {
        const elementRect = $el[0].getBoundingClientRect();
        const viewportHeight = Cypress.config('viewportHeight');
        const pageHeight = Cypress.$(cy.state('window')).height();

        expect(elementRect.bottom).to.be.closeTo(pageHeight, 0.1);
        expect(elementRect.bottom).to.be.closeTo(viewportHeight, 0.1);
      });
    });

    it(`should properly add container tabs to the tablist`, () => {
      workloadsPodPage.goTo();
      workloadsPodPage.createPod();

      const podDetails = new PodPo();

      podDetails.nameNsDescription().name().set(singlePodName);
      podDetails.addButton().click();

      podDetails.tabsPrimary().within(() => {
        cy.get('[data-testid="btn-pod"]').should('contain.text', 'Pod');
        cy.get('[data-testid="btn-container-0"]').should('contain.text', 'container-0');
        cy.get('[data-testid="btn-container-1"]').should('contain.text', 'container-1');
        cy.get('[data-testid="workload-button-add-container"]').should('contain.text', 'Add Container');
      });
    });

    // testing https://github.com/rancher/dashboard/issues/14071
    it('should remove the correct environment variable from the workload form', () => {
      cy.viewport(1280, 720);
      const podDetails = new PodPo();

      workloadsPodPage.goTo();
      workloadsPodPage.createPod();

      podDetails.nameNsDescription().name().set(singlePodName);

      // add multiple environment variables
      const envVars = [
        { key: 'FIRST_VAR', value: 'one' },
        { key: 'SECOND_VAR', value: 'two' },
        { key: 'THIRD_VAR', value: 'three' },
      ];

      envVars.forEach(({ key, value }, index) => {
        podDetails.environmentVariables().setKeyValueEnvVarAtIndex(key, value, index);
      });

      // confirm all env vars are present
      envVars.forEach(({ key }, index) => {
        podDetails.environmentVariables().getVariableAtIndex(index).find('.name input')
          .should('have.value', key)
          .and('exist');
      });

      // remove SECOND_VAR
      podDetails.environmentVariables().removeButtonAtIndex(1).click();

      // confirm only FIRST_VAR and THIRD_VAR remain
      const newEnvVars = [
        { key: 'FIRST_VAR', value: 'one' },
        { key: 'THIRD_VAR', value: 'three' },
      ];

      newEnvVars.forEach(({ key }, index) => {
        podDetails.environmentVariables().getVariableAtIndex(index).find('.name input').should('have.value', key);
      });
      podDetails.environmentVariables().getVariableByName('SECOND_VAR').should('not.exist');
    });
  });

  // describe.skip('[Vue3 Skip]: should delete pod', () => {
  //   const podName = `pod-${ Date.now() }`;

  //   beforeEach(() => {
  //     workloadsPodPage.goTo();
  //   });

  //   it('dialog should open/close as expected', () => {
  //     const podCreatePage = new WorkloadsPodsCreatePagePo(cluster);

  //     podCreatePage.goTo();

  //     podCreatePage.createWithUI(podName, 'nginx', 'default');

  //     // Should be on the list view
  //     const podsListPage = new WorkloadsPodsListPagePo(cluster);

  //     // Filter the list to just show the newly created pod
  //     podsListPage.list().resourceTable().sortableTable().filter(podName);
  //     podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

  //     // Open action menu and delete for the first item
  //     podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
  //       .getMenuItem('Delete')
  //       .click();

  //     let dialog = new PromptRemove();

  //     dialog.checkExists();
  //     dialog.checkVisible();

  //     dialog.cancel();
  //     dialog.checkNotExists();

  //     podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

  //     // Open action menu and delete for the first item
  //     podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
  //       .getMenuItem('Delete')
  //       .click();

  //     dialog = new PromptRemove();

  //     dialog.checkExists();
  //     dialog.checkVisible();
  //     dialog.remove();
  //     dialog.checkNotExists();

  //     podsListPage.list().resourceTable().sortableTable().checkRowCount(true, 1, true);

  //     podsListPage.list().resourceTable().sortableTable().resetFilter();
  //   });
  // });
});
