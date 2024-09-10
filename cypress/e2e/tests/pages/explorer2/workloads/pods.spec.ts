import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo, WorkloadsPodsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBlueprint, clonePodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { generatePodsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/pods/pods-get';

describe('Pods', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const workloadsPodPage = new WorkloadsPodsListPagePo('local');

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    const uniquePod = 'aaa-e2e-test-pod-name';
    const podNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let initialCount: number;

    before('set up', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, 'local', 'none', '{\"local\":[]}');
      cy.getRancherResource('v1', 'pods').then((resp: Cypress.Response<any>) => {
        initialCount = resp.body.count;
      });

      cy.createE2EResourceName('ns1').then((ns1) => {
        nsName1 = ns1;
        // create namespace
        cy.createNamespace(nsName1);

        // create pods
        let i = 0;

        while (i < 25) {
          const podName = `e2e-${ Cypress._.uniqueId(Date.now().toString()) }`;

          cy.createPod(nsName1, podName, 'nginx:alpine', false).then(() => {
            podNamesList.push(`pod-${ podName }`);
          });

          i++;
        }
      });

      cy.createE2EResourceName('ns2').then((ns2) => {
        nsName2 = ns2;

        // create namespace
        cy.createNamespace(nsName2);

        // create unique pod for filtering/sorting test
        cy.createPod(nsName2, uniquePod, 'nginx:alpine');
      });
    });

    it('pagination is visible and user is able to navigate through pods data', () => {
      // check pods count
      const count = initialCount + 26;

      cy.waitForRancherResources('v1', 'pods', count).then((resp: Cypress.Response<any>) => {
        WorkloadsPodsListPagePo.navTo();
        workloadsPodPage.waitForPage();

        // pagination is visible
        workloadsPodPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().rightButton().isEnabled();
        workloadsPodPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
        });

        // navigate to next page - right button
        workloadsPodPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`11 - 20 of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isEnabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        workloadsPodPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        workloadsPodPage.sortableTable().pagination().endButton().click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } Pods`);
        });

        // navigate to first page - beginning button
        workloadsPodPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('sorting changes the order of paginated pods data', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();
      // use filter to only show test data
      workloadsPodPage.sortableTable().filter('e2e-');

      // check table is sorted by name in ASC order by default
      workloadsPodPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // pod name should be visible on first page (sorted in ASC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      workloadsPodPage.sortableTable().sort(2).click({ force: true });
      workloadsPodPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'up');

      // pod name should be NOT visible on first page (sorted in DESC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).should('not.exist');

      // navigate to last page
      workloadsPodPage.sortableTable().pagination().endButton().click();

      // pod name should be visible on last page (sorted in DESC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).scrollIntoView().should('be.visible');
    });

    it('filter pods', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();

      workloadsPodPage.sortableTable().checkVisible();
      workloadsPodPage.sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.sortableTable().checkRowCount(false, 10);

      // filter by name
      workloadsPodPage.sortableTable().filter(podNamesList[0]);
      workloadsPodPage.sortableTable().checkRowCount(false, 1);
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).should('be.visible');

      // filter by namespace
      workloadsPodPage.sortableTable().filter(nsName2);
      workloadsPodPage.sortableTable().checkRowCount(false, 1);
      workloadsPodPage.sortableTable().rowElementWithName(`pod-${ uniquePod }`).should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of pods data
      generatePodsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsPodsListPagePo.navTo();
      cy.wait('@podsDataSmall');
      workloadsPodPage.waitForPage();

      workloadsPodPage.sortableTable().checkVisible();
      workloadsPodPage.sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.sortableTable().checkRowCount(false, 3);
      workloadsPodPage.sortableTable().pagination().checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, 'local', 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all pods in it)
      cy.deleteRancherResource('v1', 'namespaces', nsName1);
      cy.deleteRancherResource('v1', 'namespaces', nsName2);
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
      cy.intercept('GET', `/v1/pods/${ namespace }/${ origPodName }?exclude=metadata.managedFields`).as('origPod');
      cy.intercept('GET', `/v1/pods/${ namespace }/${ clonePodName }?exclude=metadata.managedFields`).as('clonedPod');

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

  describe.skip('[Vue3 Skip]: should delete pod', () => {
    const podName = `pod-${ Date.now() }`;

    beforeEach(() => {
      workloadsPodPage.goTo();
    });

    it('dialog should open/close as expected', () => {
      const podCreatePage = new WorkloadsPodsCreatePagePo('local');

      podCreatePage.goTo();

      podCreatePage.createWithUI(podName, 'nginx', 'default');

      // Should be on the list view
      const podsListPage = new WorkloadsPodsListPagePo('local');

      // Filter the list to just show the newly created pod
      podsListPage.list().resourceTable().sortableTable().filter(podName);
      podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

      // Open action menu and delete for the first item
      podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
        .getMenuItem('Delete')
        .click();

      let dialog = new PromptRemove();

      dialog.checkExists();
      dialog.checkVisible();

      dialog.cancel();
      dialog.checkNotExists();

      podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

      // Open action menu and delete for the first item
      podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
        .getMenuItem('Delete')
        .click();

      dialog = new PromptRemove();

      dialog.checkExists();
      dialog.checkVisible();
      dialog.remove();
      dialog.checkNotExists();

      podsListPage.list().resourceTable().sortableTable().checkRowCount(true, 1, true);

      podsListPage.list().resourceTable().sortableTable().resetFilter();
    });
  });
});
